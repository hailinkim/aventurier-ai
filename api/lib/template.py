from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder
)
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Literal
import os
import json

class Activity(BaseModel):
    time: Literal["morning", "lunch", "afternoon", "evening"] = Field(description="Time for the activity")
    activity: str = Field(description="Description of the activity or place to visit")

class Day(BaseModel):
    day: int = Field(description="Day number of the trip")
    activities: List[Activity] = Field(description="List of activities for the day")

class Itinerary(BaseModel):
    region: str = Field(description="Region or city of the trip requested by the user", default="")
    days: List[Day] = Field(description="List of days in the itinerary")
    hashtags: List[str] = Field(description="List of catchy hashtags describing the trip")
    waypoints: List[str] = Field(description="List of place names in the order that appear in the itinerary")

class Place(BaseModel):
    name: str = Field(description="Name of the place found from the context or chat history")
    description: str = Field(description="Summary of the place description related to user's request", default="")

class Places(BaseModel):
    region: str = Field(description="Region or city of the places requested by the user", default="")
    places: List[Place] = Field(description="List of places requested by user")
    waypoints: List[str] = Field(description="List of place names in the order that appear in the response")

def generate_few_shot(file):
    __location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    for line in open(os.path.join(__location__, file), "r"):
        json_obj = json.loads(line)
    return json_obj

class MappingTemplate(object):
    def __init__(self):        
        self.system_template = """            
            {format_instructions}
            """
        self.human_template = """ Following is the context: {context}
        ----------------
        Below shows how you should format your output. 
        
        {format_instructions}

        Question: {input}. \
            Extract place information from the given context to answer the question.\
            Never use any prior knowledge.\
            If the context does not contain any relevant information, clearly state that you do not have enough information.\
            Translate your response into English.
        """

        self.parser = JsonOutputParser(pydantic_object=Places)
        # self.parser = PydanticOutputParser(pydantic_object=Places)

        # self.system_message_prompt = SystemMessagePromptTemplate.from_template(
        #     self.system_template,
        #     partial_variables={
        #         "format_instructions": self.parser.get_format_instructions(),
        #         # "few_shot_examples": generate_few_shot()
        #     },
        # )
        
        self.human_message_prompt = HumanMessagePromptTemplate.from_template(
            self.human_template, 
            input_variables=["input"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions(),
                # "few_shot_examples": generate_few_shot('few_shot_mapping.jsonl')
            },
        )
        self.chat_prompt = ChatPromptTemplate.from_messages(
            [
                # self.system_message_prompt, 
                self.human_message_prompt
            ]
        )       

class ItineraryTemplate(object):
    def __init__(self):
        self.contextualize_q_system_prompt = """Given a chat history and the latest user question \
            which might reference context in the chat history, formulate a standalone question \
            which can be understood without the chat history. Do NOT answer the question, \
            just reformulate it if needed and otherwise return it as is."""
        
        # self.system_template = """
        #     {format_instructions}
        #     """
        self.human_template = """Following is the context: {context}
            ----------------
            You are a travel planning assistant. \
            Based on the conversation history or the provided context, create a detailed itinerary that includes some of the places mentioned. \
            The itinerary should include recommendations for activities, dining, and sightseeing for each day, while including places mentioned in the context or chat history. \
            If no relevant context is provided, clearly state that you do not have enough information.\
            
            Below shows how you should format your output. 

            {format_instructions}
        
            Question: {input}. You must use some of the places mentioned in either the chat history or the provided context.\
                Translate your response into English."""
        
        self.contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.contextualize_q_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )

        self.parser = JsonOutputParser(pydantic_object=Itinerary)

        # self.system_message_prompt = SystemMessagePromptTemplate.from_template(
        #     self.system_template,
        #     partial_variables={
        #         "format_instructions": self.parser.get_format_instructions(),
        #         "few_shot_examples": generate_few_shot('few_shot_itinerary.jsonl')
        #     },
        # )
        
        self.human_message_prompt = HumanMessagePromptTemplate.from_template(
            self.human_template, 
            input_variables=["input"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions(),
                # "few_shot_examples": generate_few_shot('few_shot_itinerary.jsonl')
            },
        )
        self.chat_prompt = ChatPromptTemplate.from_messages(
            [
                # self.system_message_prompt, 
                MessagesPlaceholder("chat_history"),
                self.human_message_prompt
            ]
        )       