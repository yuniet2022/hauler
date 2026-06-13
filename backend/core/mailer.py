import logging
import os
from typing import Optional

import requests
from dotenv import load_dotenv

load_dotenv("/etc/autologix-backend.env")

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://carroutesystem.com").rstrip("/")
ADMIN_CONTACT_PHONE = os.getenv("ADMIN_CONTACT_PHONE", "").strip()

RESEND_API_URL = "https://api.resend.com/emails"


def _send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = "",
    reply_to: Optional[str] = None,
) -> dict:
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY missing")

    if not EMAIL_FROM:
        raise RuntimeError("EMAIL_FROM missing")

    if not to_email or not to_email.strip():
        raise RuntimeError("to_email missing")

    payload = {
        "from": EMAIL_FROM,
        "to": [to_email.strip()],
        "subject": subject,
        "html": html_body,
    }

    if text_body:
        payload["text"] = text_body

    if reply_to:
        payload["reply_to"] = reply_to

    logger.info("RESEND sending to=%s subject=%s", to_email, subject)

    try:
        response = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=8,
        )
    except requests.RequestException as e:
        raise RuntimeError(f"Resend request failed: {e}")

    logger.info("RESEND status=%s", response.status_code)
    logger.info("RESEND body=%s", response.text)

    if not response.ok:
        raise RuntimeError(f"Resend error {response.status_code}: {response.text}")

    return response.json()


def send_email(
    to_email: str,
    subject: str,
    body: str,
    text_body: str = "",
    reply_to: Optional[str] = None,
) -> dict:
    return _send_email(
        to_email=to_email,
        subject=subject,
        html_body=body,
        text_body=text_body,
        reply_to=reply_to,
    )


def send_account_approved_email(to_email: str, name: str = "") -> dict:
    display_name = name or "User"
    subject = "Your account has been approved"

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Your account is approved</h2>
        <p>Hello {display_name},</p>
        <p>Your account has been approved and is now ready.</p>
        <p>You can log in here:</p>
        <p><a href="{FRONTEND_URL}">{FRONTEND_URL}</a></p>
        <p>Thank you,<br>Car Route System</p>
      </body>
    </html>
    """

    text_body = (
        f"Hello {display_name},\n\n"
        "Your account has been approved and is now ready.\n"
        f"You can log in here: {FRONTEND_URL}\n\n"
        "Thank you,\nCar Route System"
    )

    return _send_email(to_email, subject, html_body, text_body)


def send_account_rejected_email(to_email: str, name: str = "") -> dict:
    display_name = name or "User"
    subject = "Your application was not approved"

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Application update</h2>
        <p>Hello {display_name},</p>
        <p>Your application was not approved at this time.</p>
        <p>Please contact the administrator for more information.</p>
        <p><strong>Admin phone:</strong> {ADMIN_CONTACT_PHONE or "Not available"}</p>
        <p>Thank you,<br>Car Route System</p>
      </body>
    </html>
    """

    text_body = (
        f"Hello {display_name},\n\n"
        "Your application was not approved at this time.\n"
        "Please contact the administrator for more information.\n"
        f"Admin phone: {ADMIN_CONTACT_PHONE or 'Not available'}\n\n"
        "Thank you,\nCar Route System"
    )

    return _send_email(to_email, subject, html_body, text_body)


def send_password_reset_email(to_email: str, reset_link: str, name: str = "") -> dict:
    display_name = name or "User"
    subject = "Reset your password"

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Reset your password</h2>
        <p>Hello {display_name},</p>
        <p>Click the button below to reset your password:</p>
        <p>
          <a href="{reset_link}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Reset password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>Thank you,<br>Car Route System</p>
      </body>
    </html>
    """

    text_body = (
        f"Hello {display_name},\n\n"
        f"Reset your password here: {reset_link}\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Thank you,\nCar Route System"
    )

    return _send_email(to_email, subject, html_body, text_body)


def send_driver_credentials_email(
    to_email: str,
    temp_password: str,
    name: str = "",
) -> dict:
    display_name = name or "Driver"
    subject = "Your driver account is ready"

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Your driver account is ready</h2>
        <p>Hello {display_name},</p>
        <p>Your driver account has been created successfully.</p>
        <p><strong>Email:</strong> {to_email}</p>
        <p><strong>Temporary password:</strong> {temp_password}</p>
        <p>You can log in here:</p>
        <p><a href="{FRONTEND_URL}">{FRONTEND_URL}</a></p>
        <p>For security, you will be asked to change your password after logging in.</p>
        <p>Thank you,<br>Car Route System</p>
      </body>
    </html>
    """

    text_body = (
        f"Hello {display_name},\n\n"
        "Your driver account has been created successfully.\n"
        f"Email: {to_email}\n"
        f"Temporary password: {temp_password}\n"
        f"Login here: {FRONTEND_URL}\n\n"
        "For security, you will be asked to change your password after logging in.\n\n"
        "Thank you,\nCar Route System"
    )

    return _send_email(to_email, subject, html_body, text_body)


def send_driver_welcome_email(
    to_email: str,
    temp_password: str,
    carrier_name: str = "",
    driver_name: str = "",
) -> dict:
    display_name = driver_name or "Driver"
    carrier_display = carrier_name or "your carrier"
    subject = "Welcome to Car Route System"

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Welcome to Car Route System</h2>
        <p>Hello {display_name},</p>
        <p>{carrier_display} created your driver account.</p>
        <p><strong>Email:</strong> {to_email}</p>
        <p><strong>Temporary password:</strong> {temp_password}</p>
        <p>Log in here:</p>
        <p><a href="{FRONTEND_URL}">{FRONTEND_URL}</a></p>
        <p>You will be required to change your password the first time you sign in.</p>
        <p>Thank you,<br>Car Route System</p>
      </body>
    </html>
    """

    text_body = (
        f"Hello {display_name},\n\n"
        f"{carrier_display} created your driver account.\n"
        f"Email: {to_email}\n"
        f"Temporary password: {temp_password}\n"
        f"Log in here: {FRONTEND_URL}\n\n"
        "You will be required to change your password the first time you sign in.\n\n"
        "Thank you,\nCar Route System"
    )

    return _send_email(to_email, subject, html_body, text_body)
