import os
import httpx
from typing import Optional, Dict, Any

class SMSService:
    def __init__(self):
        pass

    def get_provider_config(self) -> Dict[str, str]:
        return {
            "twilio_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
            "twilio_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
            "twilio_from": os.getenv("TWILIO_PHONE_NUMBER", ""),
            "fast2sms_key": os.getenv("FAST2SMS_API_KEY", "")
        }

    async def send_sms_otp(self, phone: str, otp: str) -> Dict[str, Any]:
        """
        Sends OTP to phone number using configured provider (Twilio, Fast2SMS)
        or returns simulated delivery details if no external provider is set yet.
        """
        config = self.get_provider_config()
        message_body = f"Your RAJGPT verification code is: {otp}. Do not share this code with anyone. Valid for 5 minutes."

        # 1. Twilio SMS Integration
        if config["twilio_sid"] and config["twilio_token"] and config["twilio_from"]:
            try:
                account_sid = config["twilio_sid"].strip()
                auth_token = config["twilio_token"].strip()
                from_number = config["twilio_from"].strip()

                async with httpx.AsyncClient(timeout=10.0) as client:
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                    res = await client.post(
                        url,
                        auth=(account_sid, auth_token),
                        data={
                            "From": from_number,
                            "To": phone,
                            "Body": message_body
                        }
                    )
                    if res.status_code in [200, 201]:
                        data = res.json()
                        return {
                            "success": True,
                            "provider": "twilio",
                            "sid": data.get("sid"),
                            "status": "sent",
                            "message": f"Real SMS dispatched to {phone} via Twilio"
                        }
                    else:
                        print(f"[Twilio Error] {res.status_code}: {res.text}")
            except Exception as e:
                print(f"[Twilio Exception] {e}")

        # 2. Fast2SMS Integration (for India +91 numbers)
        if config["fast2sms_key"] and phone.startswith("+91"):
            try:
                pure_number = phone.replace("+91", "").strip()
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        "https://www.fast2sms.com/dev/bulkV2",
                        headers={"authorization": config["fast2sms_key"].strip()},
                        json={
                            "variables_values": otp,
                            "route": "otp",
                            "numbers": pure_number
                        }
                    )
                    if res.status_code == 200:
                        return {
                            "success": True,
                            "provider": "fast2sms",
                            "status": "sent",
                            "message": f"Real SMS dispatched to {phone} via Fast2SMS"
                        }
            except Exception as e:
                print(f"[Fast2SMS Exception] {e}")

        # 3. Fallback Development & Testing Mode
        print(f"\n=======================================================")
        print(f" [SMS MESSAGE DISPATCHED]")
        print(f" To: {phone}")
        print(f" Body: {message_body}")
        print(f"=======================================================\n")

        return {
            "success": True,
            "provider": "simulator",
            "status": "simulated",
            "message": f"SMS message generated for {phone}",
            "otp": otp
        }

sms_service = SMSService()
