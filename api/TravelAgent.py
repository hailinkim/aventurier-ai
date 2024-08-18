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
import sys
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '/api/lib')))
from pymongo.errors import BulkWriteError
import time
import json
import logging
from api.lib.template import ItineraryTemplate, MappingTemplate
from api.lib.load_documents import load_documents
from langchain_upstage import UpstageGroundednessCheck
import ast 

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
        print("Time taken for adding documents to the vector store: ", time.time() - start_time)

        self.retriever = self.vectorstore.as_retriever(
            # search_type="similarity_score_threshold",
            # search_kwargs={'score_threshold': 0.3}
            search_kwargs={'k': 5}
        )

        # contextualize_q_system_prompt = """Given a chat history and the latest user question \
        # which might reference context in the chat history, formulate a standalone question \
        # which can be understood without the chat history. Do NOT answer the question, \
        # just reformulate it if needed and otherwise return it as is."""
        # contextualize_q_prompt = ChatPromptTemplate.from_messages(
        #     [
        #         ("system", contextualize_q_system_prompt),
        #         MessagesPlaceholder("chat_history"),
        #         ("human", "{input}"),
        #     ]
        # )

        # place_search_system_prompt = """You are an assistant for extracting places requested by user. \
        # Use only the following pieces of retrieved context and no prior knowledge to answer the question. \
        # If you don't know the answer, just say that you don't know. \
        # Keep the answer concise.\

        # {context}"""

        # itinerary_system_prompt = """You are an assistant for creating a travel itinerary. \
        # Use only the following pieces of retrieved context and no prior knowledge to answer the question. \
        # If you don't know the answer, just say that you don't know. \
        # Keep the answer concise.\

        # {context}""" #TO-DO: add few shot or use pydantic or structured output/bindtools
        # self.prompt_1 = ChatPromptTemplate.from_messages(
        #     [
        #         ("system", place_search_system_prompt),
        #         MessagesPlaceholder("chat_history"),
        #         ("human", "{input}"),
        #     ]
        # )

        # self.prompt_2 = ChatPromptTemplate.from_messages(
        #     [
        #         ("system", itinerary_system_prompt),
        #         MessagesPlaceholder("chat_history"),
        #         ("human", "{input}"),
        #     ]
        # )     

        # history_aware_retriever = create_history_aware_retriever(
        #     self.llm, self.retriever, contextualize_q_prompt
        # )
        # question_answer_chain = create_stuff_documents_chain(self.llm, self.prompt_1)
        # self.chain_1 = create_retrieval_chain(self.retriever, question_answer_chain)
        
        # self.chain_2 = self.prompt_2 | self.llm | StrOutputParser()  # Vegetable expert

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

        # Define how to parse the output
        def parse(output):
            # print("route query output: ", output)
            tool_calls = output.tool_calls
            if not tool_calls:
                return output.content
            return tool_calls[0]["args"]["destination"]    

        # Initialize the LLM with tools bound
        self.llm_with_tools = self.llm.bind_tools([RouteQuery])

        # Create the routing chain
        self.route_chain = route_prompt | self.llm_with_tools | parse

    def invoke(self, query: str, chat_history: List[str]):
        # Determine destination: animal or vegetable
        destination = self.route_chain.invoke({"input": query})
        if destination not in ["searchPlaces", "itinerary"]:
            # print(destination)
            # yield destination
            return {"answer": destination, "sources": []}
        #GC 

        gc = UpstageGroundednessCheck()
        groundedness_check_count = 0

        # Choose the appropriate chain based on the destination
        chain = self.chain_1 if destination == "searchPlaces" else self.chain_2

        while(groundedness_check_count < 2):
            sources = []
            # for chunk in chain.stream({"input": query, "chat_history": chat_history}):
            #     if answer_chunk := chunk.get("answer"):
            #         yield str(answer_chunk)
            #     if context_chunk := chunk.get("context"):
            #         print("".join([doc.page_content for doc in context_chunk]))
            #         yield "Sources: " + str(json.dumps([doc.metadata["_id"] for doc in context_chunk])) + "\n------"
            # Invoke the chain with the query and return the result
            response = chain.invoke({"input": query, "chat_history": chat_history})
            answer = response["answer"]
            print("Raw answer: ", answer)
            if isinstance(answer, str):
                answer = answer.replace("```json", "").replace("```", "").strip()
            # Parse the answer
            try:
                # Safely evaluate the cleaned string as a dictionary
                answer_json = json.loads(json.dumps(ast.literal_eval(answer)))
            except (ValueError, SyntaxError) as e:
                print("Error parsing answer:", e)
                groundedness_check_count += 1
                continue
            print("agent: ", answer_json)

            # Check groundedness
            context = "\n\n".join([doc.page_content for doc in response["context"]])
            groundedness_context = "User query: {query} \n\n Context: {context}".format(query=query, context=context)
            print("groundedness context: ", groundedness_context)
            groundedness_check = gc.run({"context": groundedness_context, "answer": f"The region mentioned in the user query is {answer_json['region']}. Place names in {answer_json['waypoints']} are mentioned in the context and are located in {answer_json['region']}"})
            print("groundedness check: ", groundedness_check)
            # if region_check=="notGrounded":
            #     groundedness_check_count += 1
            #     continue
            # waypoint_check = gc.run({"context": context, "answer": f"Place names in {answer_json['waypoints']} are mentioned in the context and are located in {answer_json['region']}"})
            # print("waypoint_check: ", waypoint_check)
            if groundedness_check=="grounded":
                for doc in response["context"]:
                    if doc.metadata["post_id"] not in sources:
                        sources.append(doc.metadata["post_id"])
                return {"answer": answer, "sources": sources}
            groundedness_check_count += 1
        return {"answer": "We couldn't find the information you requested. If you have another question or need help with something else, feel free to ask!", "sources": []}


                
        
        # sources = ""
        # for doc in response["context"]:
        #     sources += f"[{doc.metadata['_id']}] "
        # return "{answer}\n\nSources: {sources}".format(answer=response["answer"], sources=sources)

