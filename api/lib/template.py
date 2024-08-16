from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder
)
from langchain.output_parsers import PydanticOutputParser
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
    # date: str = Field(description="Date for this particular day in YYYY-MM-DD format")
    activities: List[Activity] = Field(description="List of activities for the day")

class Itinerary(BaseModel):
    # trip_title: str = Field(description="Title of the trip or itinerary")
    # start_date: str = Field(description="Start date of the trip in YYYY-MM-DD format")
    # end_date: str = Field(description="End date of the trip in YYYY-MM-DD format")
    days: List[Day] = Field(description="List of days in the itinerary")
    hashtags: List[str] = Field(description="List of catchy hashtags describing the trip")
    waypoints: List[str] = Field(description="List of place names in the order that appear in the itinerary")

class Place(BaseModel):
    place_name: str = Field(description="Name of the place found from the context or chat history")
    description: str = Field(description="Description of the place related to user's request", default="")

class Places(BaseModel):
    places: List[Place] = Field(description="List of places requested by user")
    waypoints: List[str] = Field(description="List of place names that appear in the itinerary")

def generate_few_shot():
    examples = []
    __location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    for line in open(os.path.join(__location__, 'few_shot_mapping.jsonl'), "r"):
        json_obj = json.loads(line)
        examples.append(json_obj)
    return examples

class MappingTemplate(object):
    def __init__(self):        
        self.system_template = """            
            {format_instructions}
            """
        self.human_template = """ Following is the context: {context}
        ----------------
        Below shows how you should format your output. For example:            
            1. Eiffel Tower: 
            - A wrought-iron lattice tower on the Champ de Mars in Paris, France. It is one of the most recognizable structures in the world.
            2. Louvre Museum:
            - The world's largest art museum and a historic monument in Paris, France.
            waypoints: [Eiffel Tower, Louvre Museum]

        Question: {input}. Extract place information from the provided context only to answer the question. Never use your prior knowledge.
        """

        # self.parser = JsonOutputParser(pydantic_object=Places)
        self.parser = PydanticOutputParser(pydantic_object=Places)

        self.system_message_prompt = SystemMessagePromptTemplate.from_template(
            self.system_template,
            partial_variables={
                "format_instructions": self.parser.get_format_instructions(),
                # "few_shot_examples": generate_few_shot()
            },
        )
        
        self.human_message_prompt = HumanMessagePromptTemplate.from_template(
            self.human_template, input_variables=["input"]
        )
        self.chat_prompt = ChatPromptTemplate.from_messages(
            [
                self.system_message_prompt, 
                self.human_message_prompt
            ]
        )       

class ItineraryTemplate(object):
    def __init__(self):
        self.contextualize_q_system_prompt = """Given a chat history and the latest user question \
            which might reference context in the chat history, formulate a standalone question \
            which can be understood without the chat history. Do NOT answer the question, \
            just reformulate it if needed and otherwise return it as is."""
        
        self.system_template = """
            {format_instructions}
            """
        self.human_template = """Following is the context: {context}
            ----------------
            You are a travel planning assistant. \
            Based on the conversation history or the provided context, create a detailed itinerary that includes some of the places mentioned. \
            The itinerary should include recommendations for activities, dining, and sightseeing for each day, while including places mentioned in the context or chat history. \
            If no relevant context is provided, clearly state that you do not have enough information.\
            
            Below shows how you should format your output. 
            Example 1: 
                Day 1:
                - Morning: Start your day with a visit to the Eiffel Tower. Arrive early to avoid the crowds and take the elevator to the top for stunning views of Paris.
                - Lunch: Enjoy a leisurely lunch at Le Jules Verne, a Michelin-starred restaurant located within the Eiffel Tower.
                - Afternoon: Head over to the Louvre Museum. Spend the afternoon exploring its vast collection of art, including the famous Mona Lisa.
                - Evening: Take a sunset Seine River cruise. Enjoy the illuminated landmarks of Paris as you glide along the river.
                
                Day 2:
                Morning: Begin your day with a stroll through the Jardin des Tuileries. This beautiful garden is located near the Louvre.
                Lunch: Dine at Le Meurice, a historic restaurant with a view of the Tuileries Garden.
                Afternoon: Visit the charming neighborhood of Montmartre. Explore the Sacre-Coeur Basilica and the quaint streets filled with artists.
                Evening: End your trip with dinner at Le Relais de l’Entrecôte, known for its delicious steak and fries."

                #EiffelDreams #LouvreLovers #SeineSunsetCruise #ParisDiningDelights

                waypoints: [Eiffel Tower, Le Jules Verne, Louvre Museum, Seine River, Tuileries Garden, Montmartre, Le Relais de l’Entrecôte]

            Example 2 (context is not provided):
                I don't have enough information to create an itinerary. Could you please provide more details or mention some places you'd like to visit?
        
            Question: {input}. You must use some of the places mentioned in either the chat history or the provided context."""
        
        self.contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.contextualize_q_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )

        self.parser = PydanticOutputParser(pydantic_object=Itinerary)

        self.system_message_prompt = SystemMessagePromptTemplate.from_template(
            self.system_template,
            partial_variables={
                "format_instructions": self.parser.get_format_instructions()
            },
        )
        
        self.human_message_prompt = HumanMessagePromptTemplate.from_template(
            self.human_template, input_variables=["input"]
        )
        self.chat_prompt = ChatPromptTemplate.from_messages(
            [
                self.system_message_prompt, 
                MessagesPlaceholder("chat_history"),
                self.human_message_prompt
            ]
        )       