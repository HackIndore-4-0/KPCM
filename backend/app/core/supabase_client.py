from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """Returns a client for Supabase PostgreSQL and Storage operations."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        # Fallback / mock client wrapper for offline local hackathon runs
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase = get_supabase_client()
