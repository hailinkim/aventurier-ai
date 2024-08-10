from dotenv import load_dotenv 
import os
from pymongo.mongo_client import MongoClient
from pymongo.operations import SearchIndexModel
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_upstage import UpstageEmbeddings, ChatUpstage
import os
from langchain_community.document_loaders.mongodb import MongodbLoader
from db import load_documents
import pprint
from typing import TypedDict
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
import json
from typing import List
from langchain_core.documents import Document
from langchain_upstage import UpstageGroundednessCheck
from langgraph.graph import END, StateGraph
from flask import Flask, request, Response, stream_with_context
import time
import langchain
from langchain_core.messages import HumanMessage
import gradio as gr
langchain.verbose = True

load_dotenv()

os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")

client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 
not_grounded_count = 0
# flask_app = Flask(__name__)


# @flask_app.route('/api/python')
def chat():
    DB_NAME = "langchain_db"
    COLLECTION_NAME = "test"
    ATLAS_VECTOR_SEARCH_INDEX_NAME = "vector_index"
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # collection.delete_many({})

    documents = load_documents()
    print(f"Loaded {len(documents)} documents.")
    vectorstore = MongoDBAtlasVectorSearch.from_documents(
        documents=documents,
        collection=collection,
        embedding=UpstageEmbeddings(model="solar-embedding-1-large"),
        index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME
    )
    retriever = vectorstore.as_retriever(
        search_kwargs={'k': 2}
    )

    class RagState(TypedDict):
        """
        Represents the state of our graph.

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
        groundedness: str

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

    tmpl = """Context information is below.
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
    prompt = ChatPromptTemplate.from_template(tmpl)
    model = ChatUpstage(temperature=0.3)

    # Solar model answer generation, given the context and question
    model_chain = prompt | model | StrOutputParser()

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
        
    def retrieve(state: RagState) -> RagState:
        docs = retriever.invoke(state['question'])
        context = format_documents(docs)
        few_shot_examples = generate_examples()
        return RagState(context=context, few_shot_examples=few_shot_examples)

    def model_answer(state: RagState) -> RagState:
        response = model_chain.invoke(state)  
        return RagState(answer=response)

    gc = UpstageGroundednessCheck()

    def generate_answer(response) -> str:
        response_json = json.loads(response)
        response_places = [f"The address of {place['name']} is {place['address']}." for place in response_json["places"]]
        return response_places

    def groundedness_check(state: RagState) -> RagState:
        global not_grounded_count

        checks = generate_answer(state["answer"])
        for check in checks:
            response = gc.run({"context": state['context'], "answer": check})
            if response == "notGrounded" or response == "notSure":
                not_grounded_count += 1
                if not_grounded_count >= 3:
                    return RagState(groundedness="notFound", answer = "No answer found")
                return RagState(groundedness=response)
        return RagState(groundedness=response)

    def groundedness_condition(state: RagState) -> RagState:
        return state['groundedness']

    workflow = StateGraph(RagState)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("model", model_answer)
    workflow.add_node("groundedness_check", groundedness_check)

    workflow.add_edge("retrieve", "model")
    workflow.add_edge("model", "groundedness_check")
    workflow.add_conditional_edges("groundedness_check", groundedness_condition, {
        "grounded": END,
        "notFound": END,
        "notGrounded": "model",
        "notSure": "model",
    })
    workflow.set_entry_point("retrieve")

    app = workflow.compile()

    # def run_workflow(question, state=None):
    #     inputs = {"question": question}
    #     return app.invoke(inputs)["answer"]

    # demo = gr.ChatInterface(
    #     run_workflow,
    #     examples=[
    #         "How to eat healthy?",
    #         "Best Places in Korea",
    #         "How to make a chatbot?",
    #     ],
    #     title="Solar Chatbot",
    #     description="Upstage Solar Chatbot",
    # )
    
    # demo.launch()
    def run_workflow(question, state=None):
        inputs = {"question": question}
        return app.invoke(inputs)["answer"]

    with gr.Blocks() as demo:
        chatbot = gr.Chatbot()
        msg = gr.Textbox()
        clear = gr.Button("Clear")
        stop = gr.Button("Stop")  # Add a Stop button

        stop_typing = False  # Flag to control the typing process

        def user(user_message, history):
            global stop_typing
            stop_typing = False 
            # Add user message to the chat history
            return "", history + [[user_message, None]]

        def bot(history):
            global stop_typing
            # Use run_workflow to get the bot's response
            bot_response = run_workflow(history[-1][0])  # Fetch response from the app
            history[-1][1] = ""
            for character in bot_response:
                if stop_typing:
                    break  # Exit the loop if the stop button is pressed
                history[-1][1] += character
                time.sleep(0.01)  # Simulate typing by sleeping for 50ms between characters
                yield history  # Yield the updated history to stream the output

        def stop_typing_func():
            global stop_typing
            stop_typing = True  # Set the flag to stop the bot typing

        # Submit user input to the `user` function, then pass the result to the `bot` function for response
        msg.submit(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, chatbot, chatbot
        )
        stop.click(stop_typing_func)  # Stop the bot from typing
        # Clear the chat history
        clear.click(lambda: None, None, chatbot, queue=False)

    # Launch the Gradio interface
    demo.launch()

if __name__ == '__main__':
    chat()