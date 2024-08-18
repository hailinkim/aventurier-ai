# import sys
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '/api/lib')))
from langchain.prompts import ChatPromptTemplate
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from typing import TypedDict, Literal, List
from pymongo.mongo_client import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
import os 
from dotenv import load_dotenv 
from langchain.chains import create_history_aware_retriever
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from pymongo.errors import BulkWriteError
import time
import json
import logging
from api.lib.template import ItineraryTemplate, MappingTemplate
from api.lib.load_documents import load_documents
from langchain_upstage import UpstageGroundednessCheck
import ast 
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain.retrievers import ContextualCompressionRetriever

load_dotenv()
os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")
client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 
DB_NAME = "langchain_db"
COLLECTION_NAME = "test"
ATLAS_VECTOR_SEARCH_INDEX_NAME = "vector_index"
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Define the class to wrap the logic as an agent
class TravelAgent:
    def __init__(self, username):
        self.llm = ChatUpstage(temperature=0.3)
        self.vectorstore = MongoDBAtlasVectorSearch(
            collection=collection,
            embedding=UpstageEmbeddings(model="solar-embedding-1-large"),
            index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME,
            relevance_score_fn="cosine"
        )
        start_time = time.time()
        documents, document_ids = load_documents(username)
        matching_count = collection.count_documents({"_id": {"$in": document_ids}})
        if matching_count != len(document_ids):
            try:
                self.vectorstore.add_documents(documents=documents, ids=document_ids)
            except BulkWriteError as e:
                pass
                logging.error(e.details)
        # print("Time taken for adding documents to the vector store: ", time.time() - start_time)

        retriever = self.vectorstore.as_retriever(
            search_kwargs={'k': 5}
        )
        # Use contextual compression to retrieve relevant documents only
        _filter = LLMChainFilter.from_llm(self.llm)
        self.retriever = ContextualCompressionRetriever(
            base_compressor=_filter, base_retriever=retriever
        )

        self.prompt_1 = MappingTemplate()
        question_answer_chain = create_stuff_documents_chain(self.llm, self.prompt_1.chat_prompt)
        self.chain_1 = create_retrieval_chain(self.retriever, question_answer_chain)

        self.prompt_2 = ItineraryTemplate()
        history_aware_retriever = create_history_aware_retriever(self.llm, self.retriever, self.prompt_2.contextualize_q_prompt)
        question_answer_chain = create_stuff_documents_chain(self.llm, self.prompt_2.chat_prompt)
        self.chain_2 = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        # Define the routing logic
        route_system = "Route the user's query to searchPlaces, itinerary, or nowhere if irrelevant."
        route_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", route_system),
                ("human", "{input}"),
            ]
        )

        class RouteQuery(TypedDict):
            """Route query to destination."""
            destination: Literal["searchPlaces", "itinerary", ""]

        def parse(output):
            tool_calls = output.tool_calls
            if not tool_calls:
                return output.content
            return tool_calls[0]["args"]["destination"]    

        self.llm_with_tools = self.llm.bind_tools([RouteQuery])

        # Create the routing chain
        self.route_chain = route_prompt | self.llm_with_tools | parse

    def invoke(self, query: str, chat_history: List[str]):
        destination = self.route_chain.invoke({"input": query})
        if destination not in ["searchPlaces", "itinerary"]:
            return {"answer": destination, "sources": []}

        gc = UpstageGroundednessCheck()
        groundedness_check_count = 0

        # Choose the appropriate chain based on the user's query
        chain = self.chain_1 if destination == "searchPlaces" else self.chain_2

        while(groundedness_check_count < 2):
            sources = []
            response = chain.invoke({"input": query, "chat_history": chat_history})
            answer = response["answer"]
            # parse the answer
            if isinstance(answer, str):
                answer = answer.replace("```json", "").replace("```", "").strip()
            try:
                answer_json = json.loads(json.dumps(ast.literal_eval(answer)))
            except (ValueError, SyntaxError) as e:
                logging.error(e)
                groundedness_check_count += 1
                continue

            # Check groundedness
            context = "\n\n".join([doc.page_content for doc in response["context"]])
            if not context:
                break
            groundedness_context = "User query: {query} \n\n Context: {context}".format(query=query, context=context)
            groundedness_check = gc.run({"context": groundedness_context, 
                                        "answer": f"The region mentioned in the user query is {answer_json['region']}. Place names in {answer_json['waypoints']} are mentioned in the context and are located in {answer_json['region']}"})
            if groundedness_check=="grounded":
                for doc in response["context"]:
                    if doc.metadata["post_id"] not in sources:
                        sources.append(doc.metadata["post_id"])
                return {"answer": answer, "sources": sources}
            groundedness_check_count += 1
        return {"answer": "We couldn't find the information you requested. If you have another question or need help with something else, feel free to ask!", "sources": []}