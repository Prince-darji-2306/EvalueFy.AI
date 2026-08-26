import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()


def get_llm_openai(model_name: str = None, temperature: float = 0.7):
    """
    Initializes and returns an LLM instance via OpenRouter.
    Falls back gracefully if specific models or environment variables vary.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    model = 'cohere/north-mini-code:free'


    return ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=temperature,
    )

def get_llm(model_name: str = None, temperature: float = 0.7):
    """
    Initializes and returns an LLM instance via Groq.
    Falls back gracefully if specific models or environment variables vary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = "openai/gpt-oss-120b"

    return ChatGroq(
        model=model,
        api_key=api_key,
        temperature=temperature,
    )
