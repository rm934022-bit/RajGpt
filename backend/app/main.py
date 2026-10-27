import os
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from .database import engine, Base, get_db
from . import models, schemas
from .services.gemini_service import GeminiService, AVAILABLE_MODELS
import random
import base64
from datetime import timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .services.sms_service import sms_service

from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate columns for existing databases
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE conversations ADD COLUMN user_id VARCHAR(36)"))
        conn.commit()
    except Exception:
        pass

app = FastAPI(
    title="RAJGPT API",
    description="Backend API powering modern RAJGPT web application with SQLite and Gemini AI",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_service = GeminiService()

def get_persisted_setting(db: Session, key: str, default: str = "") -> str:
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
    if setting and setting.value:
        return setting.value
    return os.getenv(key, default)

def set_persisted_setting(db: Session, key: str, value: str):
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
    if not setting:
        setting = models.AppSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
    db.commit()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "rajgpt-api"}

@app.get("/api/models")
def get_models():
    return {"models": AVAILABLE_MODELS}

def parse_google_id_token(token: str, client_id: Optional[str] = None) -> dict:
    if not token or token == "simulated":
        return {}
    if client_id:
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
            return {
                "email": idinfo.get("email"),
                "name": idinfo.get("name"),
                "avatar": idinfo.get("picture")
            }
        except Exception as e:
            print(f"[Google Verification Notice] {e}")

    # Fallback to standard base64 decoding of the JWT payload
    try:
        parts = token.split(".")
        if len(parts) == 3:
            padding = len(parts[1]) % 4
            padded = parts[1] + ("=" * (4 - padding) if padding else "")
            payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
            return {
                "email": payload.get("email"),
                "name": payload.get("name"),
                "avatar": payload.get("picture")
            }
    except Exception as e:
        print(f"[Google Parse Notice] {e}")
    return {}

@app.get("/api/settings", response_model=schemas.SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    key = get_persisted_setting(db, "GEMINI_API_KEY", "")
    default_model = get_persisted_setting(db, "DEFAULT_MODEL", "gemini-3-flash-preview")
    google_client_id = get_persisted_setting(db, "GOOGLE_CLIENT_ID", "")
    twilio_sid = get_persisted_setting(db, "TWILIO_ACCOUNT_SID", "")
    fast2sms = get_persisted_setting(db, "FAST2SMS_API_KEY", "")

    masked = None
    if key and len(key) > 6:
        masked = key[:4] + "..." + key[-4:]
    elif key:
        masked = "••••••••"
    return schemas.SettingsResponse(
        has_api_key=bool(key),
        gemini_api_key_masked=masked,
        default_model=default_model,
        google_client_id=google_client_id or None,
        has_twilio=bool(twilio_sid),
        has_fast2sms=bool(fast2sms)
    )

@app.post("/api/settings", response_model=schemas.SettingsResponse)
def update_settings(payload: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    if payload.gemini_api_key is not None:
        set_persisted_setting(db, "GEMINI_API_KEY", payload.gemini_api_key.strip())
    if payload.default_model is not None:
        set_persisted_setting(db, "DEFAULT_MODEL", payload.default_model)
    if payload.google_client_id is not None:
        set_persisted_setting(db, "GOOGLE_CLIENT_ID", payload.google_client_id.strip())
    if payload.twilio_account_sid is not None:
        set_persisted_setting(db, "TWILIO_ACCOUNT_SID", payload.twilio_account_sid.strip())
        os.environ["TWILIO_ACCOUNT_SID"] = payload.twilio_account_sid.strip()
    if payload.twilio_auth_token is not None:
        set_persisted_setting(db, "TWILIO_AUTH_TOKEN", payload.twilio_auth_token.strip())
        os.environ["TWILIO_AUTH_TOKEN"] = payload.twilio_auth_token.strip()
    if payload.twilio_phone_number is not None:
        set_persisted_setting(db, "TWILIO_PHONE_NUMBER", payload.twilio_phone_number.strip())
        os.environ["TWILIO_PHONE_NUMBER"] = payload.twilio_phone_number.strip()
    if payload.fast2sms_api_key is not None:
        set_persisted_setting(db, "FAST2SMS_API_KEY", payload.fast2sms_api_key.strip())
        os.environ["FAST2SMS_API_KEY"] = payload.fast2sms_api_key.strip()
    return get_settings(db)

# ==========================================
# Authentication Endpoints (Google & Phone OTP)
# ==========================================

@app.post("/api/auth/phone/send-otp")
async def send_phone_otp(payload: schemas.SendOTPRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 8:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number with country code")

    # Generate 6-digit OTP code
    otp_code = str(random.randint(100000, 999999))
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=5)

    otp_record = models.PhoneOTP(
        phone=clean_phone,
        otp=otp_code,
        created_at=now,
        expires_at=expires,
        is_used="false"
    )
    db.add(otp_record)
    db.commit()

    # Dispatch via real SMS provider (Twilio / Fast2SMS) or simulator
    sms_res = await sms_service.send_sms_otp(clean_phone, otp_code)

    return {
        "success": True,
        "message": sms_res.get("message", f"Verification code sent to {clean_phone}"),
        "phone": clean_phone,
        "provider": sms_res.get("provider", "simulator"),
        "status": sms_res.get("status", "sent"),
        "test_otp": otp_code
    }

@app.post("/api/auth/phone/verify-otp", response_model=schemas.AuthResponse)
def verify_phone_otp(payload: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone.strip().replace(" ", "").replace("-", "")
    entered_otp = payload.otp.strip()

    # Look for matching active OTP
    now = datetime.now(timezone.utc)
    record = db.query(models.PhoneOTP).filter(
        models.PhoneOTP.phone == clean_phone,
        models.PhoneOTP.otp == entered_otp,
        models.PhoneOTP.is_used == "false"
    ).order_by(models.PhoneOTP.created_at.desc()).first()

    # Fallback master testing code: "123456" for convenience if testing offline
    if not record and entered_otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    if record:
        record.is_used = "true"
        db.commit()

    # Find or create user
    user = db.query(models.User).filter(models.User.phone == clean_phone).first()
    if not user:
        user_name = payload.name.strip() if payload.name and payload.name.strip() else f"User {clean_phone[-4:]}"
        user = models.User(
            name=user_name,
            phone=clean_phone,
            auth_provider="phone"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = f"token_{user.id}"
    return schemas.AuthResponse(
        user=user,
        token=token,
        message="Phone authentication successful"
    )

@app.post("/api/auth/google", response_model=schemas.AuthResponse)
def google_auth(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    google_client_id = get_persisted_setting(db, "GOOGLE_CLIENT_ID", "")

    # If credential was provided (real Google Identity Services JWT)
    if payload.credential:
        parsed = parse_google_id_token(payload.credential, google_client_id)
        email = parsed.get("email") or payload.email
        name = parsed.get("name") or payload.name
        avatar = parsed.get("avatar") or payload.avatar
    else:
        email = payload.email
        name = payload.name
        avatar = payload.avatar

    if not email:
        email = "google.user@gmail.com"
        name = "Google User"

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            name=name or email.split("@")[0],
            email=email,
            avatar=avatar,
            auth_provider="google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if name and user.name != name:
            user.name = name
        if avatar and user.avatar != avatar:
            user.avatar = avatar
        db.commit()

    token = f"token_{user.id}"
    return schemas.AuthResponse(
        user=user,
        token=token,
        message="Google authentication successful"
    )

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user(token: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if not token or not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = token.replace("token_", "")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/conversations", response_model=List[schemas.ConversationSummary])
def list_conversations(
    q: Optional[str] = Query(None, description="Search term in title or messages"),
    user_id: Optional[str] = Query(None, description="User ID filter"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Conversation)

    # Filter strictly by account:
    # If user_id provided, only show that user's chats.
    # If no user_id (guest), only show guest chats (user_id is NULL).
    if user_id and user_id.strip():
        query = query.filter(models.Conversation.user_id == user_id.strip())
    else:
        query = query.filter(models.Conversation.user_id.is_(None))

    if q and q.strip():
        term = f"%{q.strip()}%"
        # Search by title or messages
        query = query.filter(
            models.Conversation.title.ilike(term) |
            models.Conversation.messages.any(models.Message.content.ilike(term))
        )
    conversations = query.order_by(models.Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        last_msg = conv.messages[-1].content[:80] if conv.messages else None
        result.append(
            schemas.ConversationSummary(
                id=conv.id,
                title=conv.title,
                model=conv.model,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=len(conv.messages),
                last_message=last_msg
            )
        )
    return result

@app.post("/api/conversations", response_model=schemas.ConversationDetail)
def create_conversation(
    payload: schemas.ConversationCreate = schemas.ConversationCreate(),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    default_model = get_persisted_setting(db, "DEFAULT_MODEL", "gemini-3-flash-preview")
    model = payload.model if payload.model else default_model
    assigned_user_id = payload.user_id or user_id or None

    conversation = models.Conversation(
        user_id=assigned_user_id,
        title=payload.title or "New chat",
        model=model,
        system_prompt=payload.system_prompt or ""
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@app.get("/api/conversations/{conv_id}", response_model=schemas.ConversationDetail)
def get_conversation(
    conv_id: str,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Conversation).filter(models.Conversation.id == conv_id)
    if user_id and user_id.strip():
        query = query.filter(models.Conversation.user_id == user_id.strip())
    conversation = query.first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@app.patch("/api/conversations/{conv_id}", response_model=schemas.ConversationDetail)
def update_conversation(
    conv_id: str,
    payload: schemas.ConversationUpdate,
    db: Session = Depends(get_db)
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if payload.title is not None:
        conversation.title = payload.title.strip()
    if payload.model is not None:
        conversation.model = payload.model
    if payload.system_prompt is not None:
        conversation.system_prompt = payload.system_prompt

    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    return conversation

@app.delete("/api/conversations/{conv_id}")
def delete_conversation(conv_id: str, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return {"deleted": True, "id": conv_id}

@app.delete("/api/conversations")
def clear_all_conversations(user_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if user_id and user_id.strip():
        db.query(models.Conversation).filter(models.Conversation.user_id == user_id.strip()).delete()
    else:
        db.query(models.Conversation).filter(models.Conversation.user_id.is_(None)).delete()
    db.commit()
    return {"cleared": True}

@app.post("/api/conversations/{conv_id}/messages")
async def send_message(
    conv_id: str,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Update conversation model if specified
    if payload.model:
        conversation.model = payload.model
    if payload.system_prompt is not None:
        conversation.system_prompt = payload.system_prompt

    # Save user message to database
    user_msg = models.Message(
        conversation_id=conversation.id,
        role="user",
        content=user_text
    )
    db.add(user_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)

    # Build entire multi-turn conversation history for context
    history_messages = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
    ]

    api_key = get_persisted_setting(db, "GEMINI_API_KEY", "")
    is_first_msg = (len(conversation.messages) == 1 and conversation.title == "New chat")

    # Generator for SSE streaming
    async def sse_event_stream():
        full_assistant_response = []
        try:
            # First send metadata event with conversation title and id
            yield f"data: {json.dumps({'event': 'metadata', 'conversation_id': conversation.id, 'title': conversation.title})}\n\n"

            # Auto-generate title in background if needed
            if is_first_msg:
                try:
                    new_title = await gemini_service.generate_title_async(user_text, custom_api_key=api_key)
                    if new_title and new_title != "New chat":
                        with SessionLocal() as title_db:
                            conv_title = title_db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                            if conv_title:
                                conv_title.title = new_title
                                title_db.commit()
                        yield f"data: {json.dumps({'title': new_title})}\n\n"
                except Exception:
                    pass

            stream_gen = gemini_service.generate_response_stream(
                messages=history_messages,
                model=conversation.model,
                system_prompt=conversation.system_prompt,
                custom_api_key=api_key
            )

            async for event_line in stream_gen:
                if event_line.startswith("data: "):
                    payload_json = json.loads(event_line[6:].strip())
                    if "chunk" in payload_json:
                        full_assistant_response.append(payload_json["chunk"])
                    yield event_line

            # Save completed assistant response to database
            final_text = "".join(full_assistant_response).strip()
            if final_text:
                with SessionLocal() as save_db:
                    assistant_msg = models.Message(
                        conversation_id=conv_id,
                        role="assistant",
                        content=final_text
                    )
                    save_db.add(assistant_msg)
                    conv_to_update = save_db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                    if conv_to_update:
                        conv_to_update.updated_at = datetime.now(timezone.utc)
                    save_db.commit()

        except Exception as e:
            error_data = json.dumps({"error": f"Service notice: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

    from .database import SessionLocal
    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/conversations/{conv_id}/export")
def export_conversation(conv_id: str, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    md_lines = [
        f"# {conversation.title}",
        f"**Model:** {conversation.model}",
        f"**Date:** {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "",
        "---",
        ""
    ]

    for msg in conversation.messages:
        role_label = "User" if msg.role == "user" else "RAJGPT"
        timestamp = msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
        md_lines.append(f"### {role_label} ({timestamp})")
        md_lines.append("")
        md_lines.append(msg.content)
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")

    content = "\n".join(md_lines)
    filename = f"{conversation.title.replace(' ', '_')[:30]}.md"
    return PlainTextResponse(
        content,
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Content-Type": "text/markdown; charset=utf-8"
        }
    )

# Mount frontend static distribution if built
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    # Serve static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    # Fallback to index.html for SPA client-side routes (e.g. /c/:id)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

