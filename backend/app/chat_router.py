from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db
from .ai_client import build_system_prompt, get_ai_reply

router = APIRouter(prefix="/orgs/{org_id}/chat", tags=["chat"])

@router.post("", response_model=schemas.ChatResponse)
def chat(org_id: str, payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    agent_config = db.query(models.AgentConfig).filter(models.AgentConfig.org_id == org_id).first()
    if not agent_config or not agent_config.is_active:
        raise HTTPException(status_code=404, detail="AI receptionist is not available for this organization")

    # Get or create the conversation
    if payload.session_id:
        conversation = (
            db.query(models.Conversation)
            .filter(models.Conversation.id == payload.session_id, models.Conversation.org_id == org_id)
            .first()
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = models.Conversation(org_id=org_id, customer_identifier=payload.customer_identifier)
        db.add(conversation)
        db.flush()

    user_msg = models.Message(conversation_id=conversation.id, role=models.MessageRole.user, content=payload.message)
    db.add(user_msg)
    db.flush()

    history = [
        {"role": m.role.value, "content": m.content}
        for m in conversation.messages
        if m.id != user_msg.id
    ]

    system_prompt = build_system_prompt(agent_config, org.name)
    reply_text = get_ai_reply(system_prompt, history, payload.message)

    assistant_msg = models.Message(conversation_id=conversation.id, role=models.MessageRole.assistant, content=reply_text)
    db.add(assistant_msg)

    db.commit()

    return schemas.ChatResponse(session_id=conversation.id, reply=reply_text)