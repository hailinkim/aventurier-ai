import json
from flask import Flask, request
from api.TravelAgent import TravelAgent
from api.Search import search

app = Flask(__name__)
@app.route('/api/python', methods=['POST'])
def stream():
    data = request.json   
    query = data.get('question', '')
    username = data.get('username', '')
    mode = data.get('mode', '')
    # chat mode
    if mode == "chat":
        chat_history = data.get('chat_history', [])
        agent = TravelAgent(username)
        response = agent.invoke(query, chat_history[:4]) 
        return json.dumps(response)
    # search mode
    search_result = search(username, query)
    return json.dumps(search_result)