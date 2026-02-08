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

def get_response(question, answer):
    llm = get_llm()
    prompt = f"""
    You are a interviewer.
    Question: {question}
    Answer: {answer}
    
    Ignore all the grammatical errors, as well as number errors and spelling and number errors.
    You are a human you have to understand by language.
    Provide a very concise and short response in the following format:
    SCORE: [0-10]
    REASON: [Why this score was given]
    IMPROVEMENTS: [How the answer could be better]
    """
    response = llm.invoke(prompt)
    return response.content

