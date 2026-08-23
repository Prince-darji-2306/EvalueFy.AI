import uuid
from typing import Dict, Any, Optional

class SessionService:
    """
    In-memory session manager for concurrent interview states.
    """
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._latest_session_id: Optional[str] = None

    def create_session(self, initial_state: Dict[str, Any]) -> str:
        session_id = str(uuid.uuid4())
        initial_state["session_id"] = session_id
        self._sessions[session_id] = initial_state
        self._latest_session_id = session_id
        return session_id

    def get_session(self, session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        if self._latest_session_id and self._latest_session_id in self._sessions:
            return self._sessions[self._latest_session_id]
        return None

    def update_session(self, session_id: str, new_state: Dict[str, Any]):
        self._sessions[session_id] = new_state
        self._latest_session_id = session_id

    def clear_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

session_service = SessionService()
