# backend/utils_scraper.py
"""
Web Scraping Utilities for the Research Agent.

Provides functions to fetch and clean web page content for analysis.
Designed to be lightweight and respectful of target websites.
"""

import re
from typing import Optional, Dict, Any
from urllib.parse import urlparse

try:
    import httpx
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False
    print("[!] Web scraping dependencies not installed. Run: pip install httpx beautifulsoup4")


# Default headers to appear as a normal browser
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Tags to remove from scraped content
REMOVE_TAGS = [
    'script', 'style', 'nav', 'footer', 'header', 'aside',
    'noscript', 'iframe', 'svg', 'canvas', 'video', 'audio',
    'form', 'button', 'input', 'select', 'textarea'
]

# Maximum content length to return (to avoid token overflow)
MAX_CONTENT_LENGTH = 8000


def normalize_url(url: str) -> str:
    """Add https:// if missing"""
    if not url.startswith(('http://', 'https://')):
        return f"https://{url}"
    return url


def is_valid_url(url: str) -> bool:
    """Check if a string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme in ('http', 'https'), result.netloc])
    except Exception:
        return False


def extract_url_from_text(text: str) -> Optional[str]:
    """
    Extract the first URL found in a text string.
    Detects both full URLs (http://, https://) and domain-only URLs (e.g., "orbidi.com").
    Useful for detecting URLs in user messages.
    """
    # Pattern for domain-only URLs: domain.com or www.domain.com
    # Matches valid domain names with optional www prefix
    domain_pattern = r'\b(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+'
    
    # Pattern for full URLs with http/https
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    
    # Try http/https URLs first (more specific)
    match = re.search(url_pattern, text)
    if match:
        url = match.group(0).rstrip('.,;:!?)')
        if is_valid_url(url):
            return url
    
    # Try domain-only URLs (e.g., "orbidi.com")
    match = re.search(domain_pattern, text)
    if match:
        domain = match.group(0).rstrip('.,;:!?)')
        # Normalize by adding https://
        normalized = normalize_url(domain)
        if is_valid_url(normalized):
            return normalized
    
    return None


def clean_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters that might cause issues
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Normalize quotes and dashes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    text = text.replace('–', '-').replace('—', '-')
    return text.strip()


def scrape_url(url: str, timeout: float = 10.0) -> Dict[str, Any]:
    """
    Fetch and extract clean text content from a URL.
    Automatically normalizes URLs (adds https:// if missing).

    Args:
        url: The URL to scrape (can be domain-only or full URL)
        timeout: Request timeout in seconds

    Returns:
        Dict containing:
            - success: bool
            - url: str (the scraped URL, normalized)
            - title: str (page title)
            - content: str (cleaned text content)
            - meta_description: str (if available)
            - error: str (if failed)
    """
    if not SCRAPING_AVAILABLE:
        return {
            "success": False,
            "url": url,
            "error": "Scraping dependencies not installed"
        }

    # Normalize URL before validation and scraping
    normalized_url = normalize_url(url)
    
    if not is_valid_url(normalized_url):
        return {
            "success": False,
            "url": url,
            "error": "Invalid URL format"
        }
    
    # Use normalized URL for scraping
    url = normalized_url

    try:
        print(f"[SCRAPER] Fetching: {url}")

        # Make the request
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(url, headers=DEFAULT_HEADERS)
            response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract title
        title = ""
        if soup.title:
            title = clean_text(soup.title.string or "")

        # Extract meta description
        meta_desc = ""
        meta_tag = soup.find('meta', attrs={'name': 'description'})
        if meta_tag and meta_tag.get('content'):
            meta_desc = clean_text(meta_tag['content'])

        # Remove unwanted tags
        for tag_name in REMOVE_TAGS:
            for tag in soup.find_all(tag_name):
                tag.decompose()

        # Extract main content
        # Try to find main content area first
        main_content = soup.find('main') or soup.find('article') or soup.find('body')

        if main_content:
            # Get all text, preserving some structure
            paragraphs = []
            for element in main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'span', 'div']):
                text = clean_text(element.get_text())
                if text and len(text) > 20:  # Filter out tiny snippets
                    paragraphs.append(text)

            content = "\n".join(paragraphs)
        else:
            content = clean_text(soup.get_text())

        # Truncate if too long
        if len(content) > MAX_CONTENT_LENGTH:
            content = content[:MAX_CONTENT_LENGTH] + "... [truncated]"

        print(f"[SCRAPER] Success: {len(content)} chars extracted from {url}")

        return {
            "success": True,
            "url": url,
            "title": title,
            "content": content,
            "meta_description": meta_desc
        }

    except httpx.TimeoutException:
        print(f"[SCRAPER] Timeout: {url}")
        return {
            "success": False,
            "url": url,
            "error": "Request timed out"
        }
    except httpx.HTTPStatusError as e:
        print(f"[SCRAPER] HTTP Error: {e.response.status_code}")
        return {
            "success": False,
            "url": url,
            "error": f"HTTP {e.response.status_code}"
        }
    except Exception as e:
        print(f"[SCRAPER] Error: {str(e)}")
        return {
            "success": False,
            "url": url,
            "error": str(e)
        }


def generate_mock_research(project_name: str, industry: str = "") -> Dict[str, Any]:
    """
    Generate mock research data when scraping is unavailable or fails.
    Uses industry-specific templates to provide useful defaults.

    Args:
        project_name: Name of the business/project
        industry: Type of business (optional)

    Returns:
        Dict with mock research findings
    """
    industry_lower = industry.lower() if industry else ""

    # Industry-specific mock data
    industry_templates = {
        "restaurant": {
            "brand_personality": "Warm, inviting, and focused on creating memorable dining experiences",
            "key_services": ["Dine-in service", "Takeout & delivery", "Catering", "Private events"],
            "target_audience": "Food enthusiasts aged 25-55 who appreciate quality cuisine and ambiance",
            "suggested_colors": ["Warm Orange", "Deep Red", "Cream", "Dark Wood Brown"],
            "market_trends": [
                "Online ordering and delivery integration is essential",
                "Farm-to-table and sustainability messaging resonates",
                "Visual-first design with food photography prominence",
                "Mobile-optimized menus are expected"
            ]
        },
        "legal": {
            "brand_personality": "Professional, trustworthy, and authoritative with approachable expertise",
            "key_services": ["Legal consultation", "Case representation", "Document preparation", "Legal advice"],
            "target_audience": "Individuals and businesses seeking reliable legal representation",
            "suggested_colors": ["Navy Blue", "Gold", "White", "Charcoal Gray"],
            "market_trends": [
                "Virtual consultations are now standard",
                "Clear pricing transparency builds trust",
                "Client testimonials are crucial for credibility",
                "Educational content marketing drives leads"
            ]
        },
        "tech": {
            "brand_personality": "Innovative, modern, and solution-oriented with cutting-edge expertise",
            "key_services": ["Software development", "IT consulting", "Digital transformation", "Technical support"],
            "target_audience": "Businesses seeking digital solutions and technology modernization",
            "suggested_colors": ["Electric Blue", "White", "Dark Gray", "Accent Green"],
            "market_trends": [
                "AI and automation messaging is highly relevant",
                "Case studies demonstrate concrete value",
                "Security and compliance certifications matter",
                "Integration capabilities are key differentiators"
            ]
        },
        "health": {
            "brand_personality": "Caring, professional, and wellness-focused with patient-centered approach",
            "key_services": ["Health consultations", "Wellness programs", "Preventive care", "Treatment services"],
            "target_audience": "Health-conscious individuals and families prioritizing wellbeing",
            "suggested_colors": ["Calming Blue", "Fresh Green", "White", "Soft Teal"],
            "market_trends": [
                "Telehealth options are now expected",
                "Holistic and preventive care messaging resonates",
                "Patient reviews heavily influence decisions",
                "Easy online booking is essential"
            ]
        },
        "default": {
            "brand_personality": "Professional, approachable, and committed to delivering value",
            "key_services": ["Core service offerings", "Customer support", "Consultation", "Custom solutions"],
            "target_audience": "Customers seeking quality products/services with excellent support",
            "suggested_colors": ["Professional Blue", "Clean White", "Accent Orange", "Neutral Gray"],
            "market_trends": [
                "Mobile-first design is essential",
                "Clear value propositions drive conversions",
                "Social proof and testimonials build trust",
                "Fast page loads improve engagement"
            ]
        }
    }

    # Find matching template
    template = industry_templates["default"]
    for key in industry_templates:
        if key in industry_lower:
            template = industry_templates[key]
            break

    return {
        "success": True,
        "source": "mock_inference",
        "project_name": project_name,
        "inferred_industry": industry or "General Business",
        "brand_personality": template["brand_personality"],
        "key_services": template["key_services"],
        "target_audience": template["target_audience"],
        "suggested_color_palette": template["suggested_colors"],
        "market_trends": template["market_trends"],
        "competitors": [f"{project_name} Competitor 1", f"{project_name} Competitor 2"]
    }
