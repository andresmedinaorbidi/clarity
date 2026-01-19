# backend/database.py
"""
Session-based persistence layer using SQLAlchemy.
Stores WebsiteState per session_id for multi-tenancy support.
"""

from sqlalchemy import create_engine, Column, String, JSON, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from contextlib import contextmanager
from typing import Optional
import json
import uuid

from state_schema import WebsiteState

# SQLAlchemy setup
DATABASE_URL = "sqlite:///./clarity_sessions.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ProjectState(Base):
    """
    Database model for storing project state per session.

    Attributes:
        session_id: Unique identifier for the user session (Primary Key)
        state_json: JSON column holding the entire WebsiteState model
        created_at: Timestamp when the session was created
        updated_at: Timestamp of the last state update
    """
    __tablename__ = "project_states"

    session_id = Column(String, primary_key=True, index=True)
    state_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


# Create tables on import
Base.metadata.create_all(bind=engine)


@contextmanager
def get_db():
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_session_id() -> str:
    """Generate a new unique session ID."""
    return str(uuid.uuid4())


def get_state(session_id: str) -> WebsiteState:
    """
    Fetch the WebsiteState for a given session_id.
    Creates a new default state if session doesn't exist.

    Args:
        session_id: The unique session identifier

    Returns:
        WebsiteState: The project state for this session
    """
    with get_db() as db:
        record = db.query(ProjectState).filter(ProjectState.session_id == session_id).first()

        if record is None:
            # Create new session with default state
            default_state = WebsiteState()
            new_record = ProjectState(
                session_id=session_id,
                state_json=default_state.model_dump()
            )
            db.add(new_record)
            db.commit()
            print(f"[DB] Created new session: {session_id}")
            return default_state

        # Reconstruct WebsiteState from JSON
        print(f"[DB] Loaded session: {session_id}")
        state_json = record.state_json.copy()
        # Ensure crm_data is always a dict, never None (for backward compatibility)
        if state_json.get("crm_data") is None:
            state_json["crm_data"] = {}
        return WebsiteState(**state_json)


def save_state(session_id: str, state: WebsiteState) -> None:
    """
    Save the WebsiteState to the database for a given session_id.

    Args:
        session_id: The unique session identifier
        state: The WebsiteState to persist
    """
    with get_db() as db:
        record = db.query(ProjectState).filter(ProjectState.session_id == session_id).first()

        if record is None:
            # Create new record if it doesn't exist
            new_record = ProjectState(
                session_id=session_id,
                state_json=state.model_dump()
            )
            db.add(new_record)
        else:
            # Update existing record
            record.state_json = state.model_dump()

        db.commit()
        print(f"[DB] Saved session: {session_id}")


def delete_session(session_id: str) -> bool:
    """
    Delete a session from the database.

    Args:
        session_id: The unique session identifier

    Returns:
        bool: True if session was deleted, False if not found
    """
    with get_db() as db:
        record = db.query(ProjectState).filter(ProjectState.session_id == session_id).first()

        if record:
            db.delete(record)
            db.commit()
            print(f"[DB] Deleted session: {session_id}")
            return True

        return False


def list_sessions() -> list:
    """
    List all active sessions (for debugging/admin purposes).

    Returns:
        list: List of session info dicts with id, created_at, updated_at
    """
    with get_db() as db:
        records = db.query(ProjectState).all()
        return [
            {
                "session_id": r.session_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "project_name": r.state_json.get("project_name", ""),
                "current_step": r.state_json.get("current_step", "intake")
            }
            for r in records
        ]
