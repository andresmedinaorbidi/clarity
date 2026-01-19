# backend/services.py

def mock_hubspot_fetcher(company_name: str) -> dict:
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