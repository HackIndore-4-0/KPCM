from fastapi import FastAPI
from core.config import settings
from core.telemetry import get_current_context, get_in_memory_spans

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="FinResolve Agentic Decision-Support & Execution Safety Engine",
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "environment": settings.environment,
        "telemetry_service": settings.otel_service_name,
        "active_spans_count": len(get_in_memory_spans()),
    }
