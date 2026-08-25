import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from langchain_openai import ChatOpenAI

def get_llm(model_name: str = None, temperature: float = 0.7):
    """
    Initializes and returns an LLM instance via OpenRouter.
    Falls back gracefully if specific models or environment variables vary.
    """
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("GROQ_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    # model = model_name or os.getenv("OPENROUTER_MODEL", "poolside/laguna-s-2.1:free")
    model = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'


    return ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=temperature,
    )
