import os
from dotenv import load_dotenv
load_dotenv()
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

def get_llm():
    return ChatGroq(
        model_name="meta-llama/llama-4-scout-17b-16e-instruct",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
