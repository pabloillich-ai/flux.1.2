"""
Application Configuration
Centralized configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database (Supabase)
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str | None = None
    
    # API
    cors_origins: str = "*"
    api_title: str = "CobranzasPro Backend"
    api_version: str = "2.0.0"
    
    # Multi-tenancy
    default_tenant_id: str = "a942b959-92f8-4ed1-8397-80ff430d8f1d"
    
    # External Services
    resend_api_key: str | None = None
    
    # Security
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    
    # Performance
    cache_ttl: int = 300  # 5 minutes
    
    class Config:
        env_file = "../.env"
        case_sensitive = False
        # Map environment variables
        fields = {
            'supabase_url': {'env': 'VITE_SUPABASE_URL'},
            'supabase_service_role_key': {'env': 'SUPABASE_SERVICE_ROLE_KEY'},
            'supabase_anon_key': {'env': 'VITE_SUPABASE_ANON_KEY'},
            'resend_api_key': {'env': 'RESEND_API_KEY'},
            'cors_origins': {'env': 'CORS_ORIGINS'},
        }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
