from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import disputes, stream, ombudsman, mocks, telemetry

app = FastAPI(
    title="FinResolve Agentic Engine API",
    description="Autonomous Resolution Agent for Complex Financial Grievances - HackIndore 4.0",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(disputes.router, prefix="/api/v1/disputes", tags=["Disputes"])
app.include_router(stream.router, prefix="/api/v1/stream", tags=["Streaming Traces"])
app.include_router(ombudsman.router, prefix="/api/v1/ombudsman", tags=["Ombudsman HITL"])
app.include_router(mocks.router, prefix="/api/v1/mocks", tags=["Simulated Ecosystem"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["Telemetry & Observability"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "FinResolve Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
