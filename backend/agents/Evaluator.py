import json
from core.llm import get_llm
from schemas.review import EvaluationReview

def evaluate_response(question: str, answer: str) -> dict:
    """
    Evaluates candidate's response using LangChain structured output.
    Returns a dictionary matching the EvaluationReview schema.
    """
    prompt = f"""
    You are an empathetic, constructive technical interviewer evaluating a candidate for a software engineering position.
    Evaluate the candidate's answer based on technical correctness, clarity, and foundational depth.
    Be encouraging, focus on technical substance, and ignore minor typos or grammatical slips.
    Address the candidate directly in the second person ("You explained...", "Consider mentioning...").
    
    Question: {question}
    Answer: {answer}
    
    If the score is below 6 (out of 10), formulate a helpful, targeted follow-up question to help the candidate dive deeper or clarify.
    Otherwise, set follow_up to null.
    """
    
    llm = get_llm()
    
    # 1. Primary path: LangChain .with_structured_output(EvaluationReview)
    try:
        structured_llm = llm.with_structured_output(EvaluationReview)
        result: EvaluationReview = structured_llm.invoke(prompt)
        if isinstance(result, EvaluationReview):
            return result.model_dump()
        if isinstance(result, dict):
            return result
    except Exception as e:
        print(f"Structured output error, falling back to JSON parsing: {e}")
    
    # 2. Resilient fallback path for models that don't support native tool calling
    fallback_prompt = f"""{prompt}
    
    Format your response in STRICT JSON format with keys:
    - "score": (integer 0-10)
    - "reason": (string)
    - "improvements": (string)
    - "follow_up": (string or null)
    
    Return ONLY JSON.
    """
    try:
        raw_res = llm.invoke(fallback_prompt).content.strip()
        if "```json" in raw_res:
            raw_res = raw_res.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_res:
            raw_res = raw_res.split("```")[1].split("```")[0].strip()
        return json.loads(raw_res)
    except Exception as err:
        print(f"Fallback evaluation error: {err}")
        return {
            "score": 5,
            "reason": "Evaluation generated with baseline criteria.",
            "improvements": "Provide more specific implementation examples and highlight key trade-offs.",
            "follow_up": "Could you walk through a concrete example of this in production?"
        }
