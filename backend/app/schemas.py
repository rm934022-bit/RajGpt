from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: Optional[str] = "New chat"
    model: Optional[str] = "gemini-3-flash-preview"
    system_prompt: Optional[str] = ""

class ConversationCreate(ConversationBase):
    user_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None

class ConversationSummary(BaseModel):
    id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationDetail(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    model: str
    system_prompt: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    stream: Optional[bool] = True

class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    default_model: Optional[str] = None
    google_client_id: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    fast2sms_api_key: Optional[str] = None

class SettingsResponse(BaseModel):
    has_api_key: bool
    gemini_api_key_masked: Optional[str] = None
    default_model: str
    google_client_id: Optional[str] = None
    has_twilio: bool = False
    has_fast2sms: bool = False

# Auth schemas
class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    auth_provider: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str
    test_otp: Optional[str] = None
