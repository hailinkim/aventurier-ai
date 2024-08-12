import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'util')))
from db import load_documents
from dotenv import load_dotenv 
from pymongo.mongo_client import MongoClient
from pymongo.operations import SearchIndexModel
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from langchain_community.document_loaders.mongodb import MongodbLoader
from typing import TypedDict
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import JsonOutputParser
# from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field, ValidationError
import json
from typing import List
from langchain_core.documents import Document
from langchain_upstage import UpstageGroundednessCheck
from langgraph.graph import END, StateGraph, START
from flask import Flask, request, Response, stream_with_context, jsonify
import time
import langchain
from langchain.tools import tool
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolInvocation
from pymongo.errors import BulkWriteError
from typing import List

langchain.verbose = True

load_dotenv()

os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")

client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 
not_grounded_count = 0
app = Flask(__name__)

@app.route('/api/python', methods=['POST'])
def chat():
    class AgentState(TypedDict):
        """
        Represents the agent state

        Attributes:
            question: question asked by the user
            answer: generated answer to the question
        """
        question: str
        answer: str
    
    data = request.json   
    question = data.get('question', '')
    inputs = {"question": question}
    username = data.get('username', '')

    DB_NAME = "langchain_db"
    COLLECTION_NAME = "test"
    ATLAS_VECTOR_SEARCH_INDEX_NAME = "vector_index"
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # collection.delete_many({})

    start_time = time.time()
    document_ids, documents = load_documents(username)
    vectorstore = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=UpstageEmbeddings(model="solar-embedding-1-large"),
        index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME,
        relevance_score_fn="cosine"
    )
    try:
        vectorstore.add_documents(documents=documents, ids=document_ids)
        print("Time taken for adding documents: ", time.time() - start_time)
    except BulkWriteError as e:
        pass
    
    # def generate_few_shot():
    #     examples = []
    #     __location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    #     for line in open(os.path.join(__location__, 'few_shot.jsonl'), "r"):
    #         json_obj = json.loads(line)
    #         examples.append(json_obj)
    #     return examples

    # example_prompt = ChatPromptTemplate.from_messages(
    #     [
    #         ("human", "{query}"),
    #         ("ai", "{response}"),
    #     ]
    # )
    # few_shot_prompt = FewShotChatMessagePromptTemplate(
    #     example_prompt=example_prompt,
    #     examples=examples,
    # )
    
    @tool
    def searchPosts(query):
        """
        return posts related to the query
        """
        results = vectorstore.similarity_search_with_score(query, k=3)
        return results
    
    @tool
    def calculator(a: int, b: int) -> int:
        """Adds a and b.

        Args:
            a: first int
            b: second int
        """
        return a + b

    @tool
    def searchPlaces(query):
        """
        return place information related to the query using RAG workflow
        """
        class RagState(TypedDict):
            """
            Represents the state of RAG pipeline

            Attributes:
                context: retrieved context
                question: question asked by the user
                answer: generated answer to the question
                groundedness: groundedness of the assistant's response
            """
            context: str
            few_shot_examples: str
            question: str
            answer: str
            format_check: str
            groundedness: str
        
        # Initialize prompt template
        template = """Context information is below.
                ---------------------
                {context}
                ---------------------
                Given the context information and not prior knowledge, \
                answer the query asking about place information.
                Please provide your answer in the form of a structured JSON format containing \
                a list of place names, address, and brief summary of the place as the information. 
                If you can't answer the query based on the context, you must respond with an empty list.
                If you can't find the address, leave it empty. 
                Keep the response in the same language as the context information.        
                Some examples are given below.

                {few_shot_examples}
                
                Question: {question}
                """

        # template = """Context information is below.
        #         ---------------------
        #         {context}
        #         ---------------------
        #         Given the context information and not prior knowledge, \
        #         answer the query extracting place information from the context.
        #         If you can't answer the query based on the context, you must respond with an empty list.

        #         {format_instructions}
                
        #         Question: {question}
        #         """
        
        class LocationSummary(BaseModel):
            name: str = Field(description="The name of the location")
            address: str = Field(description="The address of the location")
            summary: str = Field(description="A brief summary or description of the location")

        class Places(BaseModel):
            places: List[LocationSummary] = Field(description="A list of locations with name, address, and summary")
            region: str = Field(description="The region name mentioned in the query")

        # parser = JsonOutputParser(pydantic_object=Places)
        # prompt = ChatPromptTemplate.from_template(
        #     template=template,
        #     partial_variables={"format_instructions": parser.get_format_instructions()},
        # )
        prompt = ChatPromptTemplate.from_template(template)
        llm = ChatUpstage(temperature=0.3)
        model_chain = prompt | llm | StrOutputParser()
        retriever = vectorstore.as_retriever(
            search_kwargs={'k': 5}
        )
        gc = UpstageGroundednessCheck()

        # Counter for ungrounded answers
        not_grounded_count = 0

        def generate_examples():
            examples = []
            __location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
            for line in open(os.path.join(__location__, 'few_shot.jsonl'), "r"):
                json_obj = json.loads(line)
                query = json_obj["query"]
                response = json_obj["response"]
                example = f"""\
                    Question: {query}
                    Answer: {response}"""
                examples.append(example)
            return "\n\n".join(examples)

        def format_documents(docs: List[Document]) -> str:
            return "\n".join([doc.page_content for doc in docs])
        
        # Define functions used in the workflow
        def retrieve(state: RagState) -> RagState:
            start_time = time.time()
            print("query: ", state["question"])
            docs = retriever.invoke(state["question"])
            context = format_documents(docs)
            print("context: ", context)
            print("Time taken for retrieval: ", time.time() - start_time)
            # return RagState(context=context)
            few_shot_examples = generate_examples()
            return RagState(context=context, few_shot_examples=few_shot_examples)

        def model_answer(state: RagState) -> RagState:
            start_time = time.time()
            response = model_chain.invoke(state)  
            print("model answer:", response)
            print("Time taken for place info generation", time.time() - start_time)
            return RagState(answer=response)
            # if isinstance(response, str):
            #     print("str")
            #     return RagState(format_check="failure")
            
            # if isinstance(response, dict):
            #     print("dict")
            #     try:
            #         eval = Places.model_validate_json(json.dumps(response))
            #         print("eval: ", eval)
            #         Places(**response)
            #         response_json_str = json.dumps(response)
            #         response_json = json.loads(response_json_str)
            #         return RagState(answer=response_json, format_check="success")
            #     except Exception as e:
            #         print(f"Validation error: {e}")
            #         return RagState(format_check="failure")
            
            # # Default case if response is neither str nor dict
            # return RagState(format_check="failure")
        
        def check_format(state: RagState) -> str:
            return state["format_check"]   

        def generate_answer(response) -> str:
            #TO-DO: parallelize
            json_response = json.loads(response)
            print("json_response: ", json_response)
            response_places = [f"The address of {place['name']} is {place['address']}." for place in json_response["places"]]
            return response_places

        def groundedness_check(state: RagState) -> RagState:
            start_time = time.time()
            nonlocal not_grounded_count
            checks = generate_answer(state["answer"])
            #TO-DO: parallelize
            for check in checks: 
                response = gc.run({"context": state['context'], "answer": check})
                if response == "notGrounded" or response == "notSure":
                    not_grounded_count += 1
                    if not_grounded_count >= 3:
                        print("Time taken for gc check: ", time.time() - start_time)
                        return RagState(groundedness="notFound", answer="No answer found")
                    return RagState(groundedness=response)
            print("Time taken for gc check ", time.time() - start_time)
            return RagState(groundedness="grounded", answer=state["answer"])

        # Define conditions for workflow transitions
        def groundedness_condition(state: RagState) -> str:
            return state["groundedness"]
        
        def generate_place_info(response):
            if response == "No answer found":
                return "Groundedness check failed: no place information found"
            final_response = f"{response['region']}\n"
            if len(response["places"]) > 0:
                for index, place in enumerate(response["places"]):
                    final_response += f"{index+1}. {place['name']} ({place['address']}): {place['summary']}. \n"
                return final_response
            else:
                return "No place information found"

        # Create the workflow graph
        rag_workflow = StateGraph(RagState)
        rag_workflow.add_node("retrieve", retrieve)
        rag_workflow.add_node("model", model_answer)
        rag_workflow.add_node("groundedness_check", groundedness_check)

        rag_workflow.add_edge("retrieve", "model")
        # rag_workflow.add_conditional_edges("model", check_format, {
        #     "success": "groundedness_check",
        #     "failure": "model",
        # })
        rag_workflow.add_edge("model", "groundedness_check")
        rag_workflow.add_conditional_edges("groundedness_check", groundedness_condition, {
            "grounded": END,
            "notFound": END,
            "notGrounded": "model",
            "notSure": "model",
        })
        # Set the entry point of the workflow
        rag_workflow.set_entry_point("retrieve")
        rag_app = rag_workflow.compile()
        inputs = {"question": query}
        return rag_app.invoke(inputs)["answer"]
        # return generate_place_info(rag_app.invoke(inputs)["answer"])
    
    model = ChatUpstage(temperature=0.3)
    tools= [calculator, searchPlaces]
    tool_executor = ToolExecutor(tools)
    model = model.bind_tools(tools)
    
    def call_model(state: AgentState) -> AgentState:
        start_time = time.time()
        response = model.invoke(state["question"])
        print("tool calling agent response: ", response)
        print("Time taken for tool calling agent: ", time.time() - start_time)
        return AgentState(answer=response)
    
    def call_tool(state: AgentState) -> AgentState:
        start_time = time.time()
        response = state["answer"]
        print(response.tool_calls)
        if response.tool_calls:
            tool_call = response.tool_calls[0]
            action = ToolInvocation(
                tool=tool_call["name"],
                tool_input=tool_call["args"],
            )
            # We call the tool_executor and get back a response
            response = tool_executor.invoke(action)
            print("tool executor response: ", response)
            # We use the response to create a FunctionMessage
            function_message = ToolMessage(
                content=str(response), name=action.tool, tool_call_id=tool_call["id"]
            )
            print("time taken for tool calling: ", time.time() - start_time)
        return AgentState(answer=function_message.content)

    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_model)
    workflow.add_node("action", call_tool)
    workflow.add_edge("agent", "action")
    workflow.set_entry_point("agent")

    agent_app = workflow.compile()
    response = agent_app.invoke(inputs)["answer"]
    return response