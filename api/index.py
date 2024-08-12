from flask import Flask, request
app = Flask(__name__)

@app.route('/api/python')
def hello_world():
    return "<p>Hello, World!</p>"