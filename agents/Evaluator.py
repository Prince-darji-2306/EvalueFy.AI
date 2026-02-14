import json
from llm_engine import get_llm

def evaluate_response(question, answer):
    llm = get_llm()
    prompt = f"""
    You are an interviewer. Evaluate the candidate's answer to the given question. The Candidate is a Fresher. So, Do not be too strict.
    Ignore all the grammatical errors, as well as number errors and spelling errors.
    You are a human you have to understand by language.

    Question: {question}
    Answer: {answer}
    
    Provide your evaluation in STRICT JSON format with the following keys:
    - "score": An integer from 0 to 10.
    - "reason": A brief explanation of the score.
    - "improvements": Explaining How the answer could be improved.
    - "follow_up": If the score is below 6, provide a relevant follow-up question to clarify or dive deeper. Otherwise, set this to null.
    
    Return ONLY the JSON.
    """
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean up potential markdown formatting if LLM includes it
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error in evaluate_response: {e}")
        return {
            "score": 0,
            "reason": "Evaluation failed.",
            "improvements": "N/A",
            "follow_up": None
        }
