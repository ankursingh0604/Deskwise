from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from .dependencies import get_current_user


def get_org_membership(org_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> models.OrgMember:
    membership = (
        db.query(models.OrgMember)
        .filter(models.OrgMember.org_id == org_id, models.OrgMember.user_id == current_user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
    return membership


def require_owner(membership: models.OrgMember = Depends(get_org_membership)) -> models.OrgMember:
    if membership.role != models.OrgRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return membership