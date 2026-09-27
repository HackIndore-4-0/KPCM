import os
from typing import Optional

def get_supabase_client():
    """Returns a client for Supabase PostgreSQL and Storage operations."""
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        return None
    try:
        from supabase import create_client, Client
        return create_client(url, key)
    except ImportError:
        return None

supabase = get_supabase_client()
