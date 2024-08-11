from pymongo import MongoClient
import os
from dotenv import load_dotenv, dotenv_values 
# from llama_index.core import Document
from langchain_core.documents import Document
import re
from typing import Dict

load_dotenv() 

def load_documents():
    # Step 1: Connect to MongoDB
    client = MongoClient(os.getenv("NEXT_PUBLIC_MONGO_URI"))  # Adjust the URI as needed

    # Step 2: Access the Database
    db = client['instagram']  # Replace 'mydatabase' with your database name

    # Step 3: Access the Collection
    user_collection = db['users'] 

    user = user_collection.find({'username': "celine__lover"}, {"_id": 1})

    for document in user:
        user_id = document['_id']

    post_collection = db['posts'] 
    posts = post_collection.find({'user': user_id}, {'_id':1, 'caption': 1, 'location.name': 1, 'location.lng':1, 'location.lat':1})
    def generate_metadata(post: Dict) -> Dict:
        if 'location' in post:
            return {'location': post['location']}
        else:
            return {}
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
    
    documents = [Document(page_content=remove_emoji(post['caption']), metadata=generate_metadata(post), id_ = str(post['_id'])) for post in posts]
    # documents = [Document(text=remove_emoji(post['caption']), metadata=generate_metadata(post), id_ = str(post['_id'])) for post in posts]
    return documents