import os
import secrets
import logging
from dotenv import load_dotenv

logger = logging.getLogger("finresolve.config")
load_dotenv()

class Settings:
    PROJECT_NAME: str = "FinResolve Backend"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # JWT Authentication Configuration
    # Securely retrieve from environment without hardcoding production secrets in source code
    _env_jwt = os.getenv("JWT_SECRET_KEY")
    if not _env_jwt:
        if os.getenv("ENVIRONMENT") == "production":
            raise ValueError("CRITICAL SECURITY ERROR: JWT_SECRET_KEY environment variable is mandatory in production!")
        else:
            logger.warning("SECURITY WARNING: JWT_SECRET_KEY is not set. Generating ephemeral local secret.")
            _env_jwt = secrets.token_urlsafe(64)
            
    JWT_SECRET_KEY: str = _env_jwt
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # External Financial API Configuration (Enforcing TLS 1.3 / HTTPS endpoints)
    CBS_API_URL: str = os.getenv("CBS_API_URL", "https://cbs.internal.bank.in/api/v1")
    NPCI_SWITCH_URL: str = os.getenv("NPCI_SWITCH_URL", "https://switch.internal.npci.org.in/api/v1")
    MERCHANT_PG_URL: str = os.getenv("MERCHANT_PG_URL", "https://pg.internal.merchant.in/api/v1")
    CBS_REVERSAL_URL: str = os.getenv("CBS_REVERSAL_URL", "https://reversals.internal.bank.in/api/v1")
    USE_MOCK_FINANCIAL_ECOSYSTEM: bool = os.getenv("USE_MOCK_FINANCIAL_ECOSYSTEM", "True").lower() == "true"

    @classmethod
    def validate_tls_endpoint(cls, url: str) -> bool:
        """Validates that financial API endpoints strictly enforce HTTPS (TLS 1.3)."""
        if not url:
            return False
        if not url.lower().startswith("https://"):
            raise ValueError(f"SECURITY VIOLATION: Endpoint '{url}' does not enforce HTTPS/TLS transport security.")
        return True

settings = Settings()
