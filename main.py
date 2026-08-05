# Entrypoint wrapper for Render / Heroku compatibility
from app.main import app

__all__ = ["app"]
