from langchain_upstage import UpstageEmbeddings, ChatUpstage
from typing import TypedDict, Literal, List
from pymongo.mongo_client import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
import os 
from dotenv import load_dotenv
from pymongo.errors import BulkWriteError
import logging
from api.lib.load_documents import load_documents
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain_text_splitters import RecursiveCharacterTextSplitter
import json
load_dotenv()
os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")
client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 
DB_NAME = "langchain_db"
COLLECTION_NAME = "test"
ATLAS_VECTOR_SEARCH_INDEX_NAME = "vector_index"
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

def pretty_print_docs(docs):
    print(
        f"\n{'-' * 100}\n".join(
            [f"Document {i+1}:\n\n" + d.page_content + d.metadata["post_id"] for i, d in enumerate(docs)]
        )
    )

def search(username, query):
    vectorstore = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=UpstageEmbeddings(model="solar-embedding-1-large"),
        index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME,
        relevance_score_fn="cosine"
    )
    documents, document_ids = load_documents(username)
    matching_count = collection.count_documents({"_id": {"$in": document_ids}})
    if matching_count != len(document_ids):
        try:
            vectorstore.add_documents(documents=documents, ids=document_ids)
        except BulkWriteError as e:
            pass
            logging.error(e.details)
    llm = ChatUpstage(temperature=0.3)

    retriever = vectorstore.as_retriever(
                search_kwargs={'k': 21}
            )
    _filter = LLMChainFilter.from_llm(llm)

    compression_retriever = ContextualCompressionRetriever(
        base_compressor=_filter, base_retriever=retriever
    )

    result = compression_retriever.invoke(query)
    posts = []
    for doc in result:
        if doc.metadata["post_id"] not in posts:
            posts.append(doc.metadata["post_id"])
    return {"post_ids": posts}