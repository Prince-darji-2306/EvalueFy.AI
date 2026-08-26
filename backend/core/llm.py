import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

load_dotenv()

def get_llm(model_name: str = None, temperature: float = 0.7):
    """Initializes LLM via Groq (primary) or OpenRouter (fallback)."""
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return ChatGroq(
            model=model_name or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            api_key=groq_key,
            temperature=temperature,
        )
    return ChatOpenAI(
        model=model_name or os.getenv("OPENROUTER_MODEL", "cohere/north-mini-code:free"),
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        temperature=temperature,
    )
