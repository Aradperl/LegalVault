import logging
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("legalvault")


def send_verification_email(to_email: str, verify_url: str) -> bool:
    """Send the verify-email link via SES. Returns False if skipped or SES fails."""
    from_addr = (os.getenv("SES_FROM_EMAIL") or "").strip()
    if not from_addr:
        logger.warning("SES_FROM_EMAIL is not set; skipping verification email")
        return False
    region = os.getenv("AWS_REGION") or "us-east-1"
    try:
        ses = boto3.client(
            "ses",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=region,
        )
        ses.send_email(
            Source=from_addr,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": "Verify your LegalVault account", "Charset": "UTF-8"},
                "Body": {
                    "Text": {
                        "Data": (
                            "Welcome to LegalVault.\n\n"
                            "Confirm your email by opening this link:\n"
                            f"{verify_url}\n\n"
                            "This link expires in 48 hours. If you did not create an account, ignore this email."
                        ),
                        "Charset": "UTF-8",
                    }
                },
            },
        )
        return True
    except (BotoCoreError, ClientError) as exc:
        logger.error("SES send failed: %s", exc)
        return False
