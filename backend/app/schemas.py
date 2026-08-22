from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    org_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OrgMembershipOut(BaseModel):
    org_id: str
    org_name: str
    role: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    organizations: list[OrgMembershipOut] = []

    class Config:
        from_attributes = True


class OrgOut(BaseModel):
    id: str
    name: str
    plan_tier: str

    class Config:
        from_attributes = True


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AgentConfigUpdate(BaseModel):
    business_hours: Optional[str] = None
    services_offered: Optional[str] = None
    faq_knowledge_base: Optional[str] = None
    greeting_message: Optional[str] = None
    is_active: Optional[bool] = None


class AgentConfigOut(BaseModel):
    id: str
    org_id: str
    business_hours: Optional[str]
    services_offered: Optional[str]
    faq_knowledge_base: Optional[str]
    greeting_message: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    customer_identifier: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str