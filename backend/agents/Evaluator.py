import json
from core.llm import get_llm
from schemas import EvaluationReview

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
    try:
        structured_llm = llm.with_structured_output(EvaluationReview, method="function_calling")
        result = structured_llm.invoke(prompt)
        if isinstance(result, EvaluationReview):
            return result.model_dump()
        if isinstance(result, dict):
            return result
    except Exception as e:
        print(f"Structured output evaluation fallback: {e}")

    try:
        raw_res = llm.invoke(f"{prompt}\nReturn ONLY a valid JSON object with keys: score, reason, improvements, follow_up.").content.strip()
        cleaned = raw_res.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception:
        return {
            "score": 5,
            "reason": "Evaluation generated with baseline criteria.",
            "improvements": "Provide more specific implementation depth and trade-offs.",
            "follow_up": None
        }
