# backend/services/__init__.py
"""
Services package for backend business logic.

PR-03: Added enrich_service and scraper_service for the /enrich endpoint.
"""

# Re-export the mock_hubspot_fetcher for backward compatibility
# (main.py imports from services module)
from services.mock_crm import mock_hubspot_fetcher

__all__ = ["mock_hubspot_fetcher"]
