# backend/services/mock_crm.py
"""
Mock CRM service for testing purposes.
Moved from backend/services.py for better organization.
"""


def mock_hubspot_fetcher(company_name: str) -> dict:
    """
    Mock HubSpot CRM data fetcher.
    Returns company data for known test companies.
    """
    mock_database = {
        "Coffee Express": {
            "industry": "Artisan Coffee",
            "bio": "High-end roastery in Seattle.",
            "colors": ["Brown", "Cream"]
        },
        "Fast Law": {
            "industry": "Legal Services",
            "bio": "Traffic ticket defense.",
            "colors": ["Navy", "White"]
        }
    }

    # If the name matches exactly, use the database
    if company_name in mock_database:
        return mock_database[company_name]

    # Return empty dict instead of None to maintain type consistency
    return {}
