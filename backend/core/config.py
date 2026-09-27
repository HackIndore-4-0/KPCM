import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "FinResolve Agent Engine"
    environment: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    otel_service_name: str = Field(default_factory=lambda: os.getenv("OTEL_SERVICE_NAME", "finresolve-agent"))
    
    # Circuit Breaker default policies
    max_consecutive_tool_failures: int = Field(
        default_factory=lambda: int(os.getenv("MAX_CONSECUTIVE_TOOL_FAILURES", "4"))
    )
    max_token_budget: int = Field(
        default_factory=lambda: int(os.getenv("MAX_TOKEN_BUDGET", "10000"))
    )
    max_iterations: int = Field(
        default_factory=lambda: int(os.getenv("MAX_ITERATIONS", "10"))
    )
    
    # Telemetry configuration
    enable_console_exporter: bool = Field(
        default_factory=lambda: os.getenv("OTEL_CONSOLE_EXPORTER", "false").lower() == "true"
    )

settings = Settings()
