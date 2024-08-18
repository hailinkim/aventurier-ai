import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'util')))
from db import load_documents
from dotenv import load_dotenv 
from pymongo.mongo_client import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from langchain_community.document_loaders.mongodb import MongodbLoader
from typing import TypedDict
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.output_parsers import JsonOutputParser
# from langchain_core.prompts import PromptTemplate
# from pydantic import BaseModel, Field, ValidationError
import json
from langchain_core.documents import Document
from langchain.tools.retriever import create_retriever_tool
from langchain import hub
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain import hub as prompts
from langchain_core.messages import AIMessage, HumanMessage
from typing import List
from langchain_core.agents import AgentActionMessageLog, AgentFinish
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.agents.format_scratchpad import format_to_openai_function_messages
from operator import itemgetter
from typing import Literal
from typing_extensions import TypedDict
from langchain.chains import create_history_aware_retriever
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI
from flask import Flask, request, Response, stream_with_context, jsonify, session
import asyncio
from api.TravelAgent import TravelAgent
load_dotenv()
# os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")
client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 
DB_NAME = "langchain_db"
COLLECTION_NAME = "test"
ATLAS_VECTOR_SEARCH_INDEX_NAME = "vector_index"
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# def chat():
#     vectorstore = MongoDBAtlasVectorSearch(
#             collection=collection,
#             embedding=UpstageEmbeddings(model="solar-embedding-1-large"),
#             index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME,
#             relevance_score_fn="cosine"
#         )
#     retriever = vectorstore.as_retriever(
#                 search_kwargs={'k': 5}
#             )
#     llm = ChatUpstage(temperature=0.3)

#     contextualize_q_system_prompt = """Given a chat history and the latest user question \
#     which might reference context in the chat history, formulate a standalone question \
#     which can be understood without the chat history. Do NOT answer the question, \
#     just reformulate it if needed and otherwise return it as is."""
#     contextualize_q_prompt = ChatPromptTemplate.from_messages(
#         [
#             ("system", contextualize_q_system_prompt),
#             MessagesPlaceholder("chat_history"),
#             ("human", "{input}"),
#         ]
#     )
#     history_aware_retriever = create_history_aware_retriever(
#         llm, retriever, contextualize_q_prompt
#     )

#     qa_system_prompt = """You are an assistant for question-answering tasks. \
#     Use the following pieces of retrieved context to answer the question. \
#     If you don't know the answer, just say that you don't know. \
#     Use three sentences maximum and keep the answer concise.\

#     {context}"""
#     qa_prompt = ChatPromptTemplate.from_messages(
#         [
#             ("system", qa_system_prompt),
#             MessagesPlaceholder("chat_history"),
#             ("human", "{input}"),
#         ]
#     )
#     question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

#     rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

#     chat_history = []

#     question = "부산 3일 여행 계획 짜줘."
#     # ai_msg_3 = rag_chain.invoke({"input": question, "chat_history": chat_history})
#     for chunk in rag_chain.stream({"input": question, "chat_history": chat_history}):
#         if answer_chunk := chunk.get("answer"):
#             # print(f"{answer_chunk}|", end="")
#             yield answer_chunk
#         if answer_chunk := chunk.get("context"):
#             print(answer_chunk)

        # print(chunk)
    # chat_history.extend([HumanMessage(content=question), ai_msg_3["answer"]])

    # question = "부산 카페 알려줘."
    # ai_msg_1 = rag_chain.invoke({"input": question, "chat_history": chat_history})
    # chat_history.extend([HumanMessage(content=question), ai_msg_1["answer"]])

    # question = "부산 맛집 알려줘."
    # ai_msg_1 = rag_chain.invoke({"input": question, "chat_history": chat_history})
    # chat_history.extend([HumanMessage(content=question), ai_msg_1["answer"]])

    # second_question = "위에 나온 카페랑 식당으로 부산 여행계획 짜줘."
    # ai_msg_2 = rag_chain.invoke({"input": second_question, "chat_history": chat_history})

    # print(ai_msg_2["chat_history"])
    # print(ai_msg_2["answer"])

app = Flask(__name__)
@app.route('/api/python', methods=['POST'])
def stream():
    data = request.json   
    # print("data: ", data)
    query = data.get('question', '')
    username = data.get('username', '')
    chat_history = data.get('chat_history', [])
    print("history: ", chat_history)
    agent = TravelAgent(username)
    response = agent.invoke(query, chat_history[:4]) 
    print("index.py response: ", response)
    return json.dumps(response)
    # return app.response_class(response, mimetype='text')

    # return Response(chat(), content_type='text/event-stream')