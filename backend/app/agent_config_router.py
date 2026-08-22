from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db
from .auth.org_access import get_org_membership

router = APIRouter(prefix="/orgs/{org_id}/agent-config", tags=["agent-config"])


@router.get("", response_model=schemas.AgentConfigOut)
def get_agent_config(org_id: str, membership=Depends(get_org_membership), db: Session = Depends(get_db)):
    config = db.query(models.AgentConfig).filter(models.AgentConfig.org_id == org_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return config


@router.patch("", response_model=schemas.AgentConfigOut)
def update_agent_config(
    org_id: str,
    payload: schemas.AgentConfigUpdate,
    membership=Depends(get_org_membership),  # owner OR staff can update - no require_owner here
    db: Session = Depends(get_db),
):
    config = db.query(models.AgentConfig).filter(models.AgentConfig.org_id == org_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config