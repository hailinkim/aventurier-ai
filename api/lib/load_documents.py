from pymongo import MongoClient
import os
from dotenv import load_dotenv 
from langchain_core.documents import Document
import re
from typing import Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter
import hashlib
# import time

load_dotenv() 
os.environ["UPSTAGE_API_KEY"] = os.getenv("UPSTAGE_API_KEY")
os.environ["MONGODB_ATLAS_CLUSTER_URI"] = os.getenv("NEXT_PUBLIC_MONGO_URI")
client = MongoClient(os.environ["MONGODB_ATLAS_CLUSTER_URI"]) 

def load_documents(username):
    client = MongoClient(os.getenv("NEXT_PUBLIC_MONGO_URI"))
    db = client['instagram']
    user_collection = db['users'] 
    user = user_collection.find({'username': username}, {"_id": 1})

    for document in user:
        user_id = document['_id']

    post_collection = db['posts'] 
    posts = post_collection.find({'user': user_id}, {'_id':1, 'caption': 1, 'location.name': 1, 'location.lng':1, 'location.lat':1})
    
    def generate_metadata(post: Dict) -> Dict:
        if 'location' in post:
            return {'location': post['location'], 'post_id': str(post['_id'])}
        else:
            return {'post_id': str(post['_id'])}
    def remove_emoji(text):
        emoji_pattern = re.compile("["
                u"\U0001F600-\U0001F64F"  # emoticons
                u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                u"\U0001F680-\U0001F6FF"  # transport & map symbols
                u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                u"\u2700-\u27BF"          # Dingbats
                u"\uE000-\uF8FF"          # Private Use Area
                u"\u2011-\u26FF"          # General Punctuation and Symbols
                u"\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
                u"\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
                u"\U00002700-\U000027BF"  # Dingbats
                "]+", flags=re.UNICODE)
        return emoji_pattern.sub(r'', text)
    def generate_document_id(content, metadata):
        # Combine content and metadata into a single string
        combined_string = content + str(metadata)
        # Generate a SHA-256 hash of the combined string
        document_id = hashlib.sha256(combined_string.encode('utf-8')).hexdigest()
        return document_id

    document_ids = []
    documents = []
    # start = time.time()
    for post in posts:
        metadata = generate_metadata(post)
        cleaned_caption = remove_emoji(post['caption'])
        cleaned_caption = cleaned_caption.replace("�", "")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=20,
            length_function=len,
            is_separator_regex=False,
        )
        doc_list = text_splitter.split_text(cleaned_caption)
        for chunk in doc_list:
            document = Document(page_content=chunk, metadata=metadata)
            documents.append(document)
            document_ids.append(generate_document_id(chunk, metadata))
        
    # print("Time taken for splitting documents: ", time.time() - start)
    return documents, document_ids