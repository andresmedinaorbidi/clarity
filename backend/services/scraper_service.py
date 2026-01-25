# backend/services/scraper_service.py
"""
Lightweight website scraper for the /enrich endpoint.
PR-03: Scrape basic metadata from websites with strict timeouts.

Uses only stdlib + requests (if available) to minimize dependencies.
Falls back to urllib if requests is not installed.
"""

import re
from typing import Dict, Any
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import socket


def scrape_website(url: str, timeout_seconds: float = 2.0) -> Dict[str, Any]:
    """
    Fetch the URL with a strict timeout and return a small structured summary.

    Returns keys:
        - url: Original URL requested
        - final_url: URL after redirects (if any)
        - status_code: HTTP status code
        - title: Page title from <title> tag
        - meta_description: Content from <meta name="description">
        - h1: First <h1> heading text
        - text_snippet: First ~500 chars of visible text
        - error: Error message if scraping failed

    Never throws: catches all exceptions and returns { "error": "...", "url": url }.
    """
    result = {
        "url": url,
        "final_url": url,
        "status_code": None,
        "title": None,
        "meta_description": None,
        "h1": None,
        "text_snippet": None,
        "error": None,
    }

    # Validate URL format
    if not url or not isinstance(url, str):
        result["error"] = "Invalid URL provided"
        return result

    # Ensure URL has scheme
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
        result["url"] = url

    try:
        # Try with requests first (better handling, if available)
        try:
            import requests
            return _scrape_with_requests(url, timeout_seconds, result)
        except ImportError:
            # Fall back to urllib
            return _scrape_with_urllib(url, timeout_seconds, result)

    except Exception as e:
        result["error"] = f"Scraping failed: {str(e)[:200]}"
        return result


def _scrape_with_requests(url: str, timeout: float, result: Dict[str, Any]) -> Dict[str, Any]:
    """Scrape using the requests library."""
    import requests

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; ClarityBot/1.0; +https://clarity.plinng.com)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }

        response = requests.get(
            url,
            timeout=(timeout / 2, timeout),  # (connect, read) timeouts
            headers=headers,
            allow_redirects=True,
            verify=True,  # Verify SSL
        )

        result["status_code"] = response.status_code
        result["final_url"] = str(response.url)

        if response.status_code != 200:
            result["error"] = f"HTTP {response.status_code}"
            return result

        # Limit content size to prevent memory issues
        content = response.text[:50000]  # Max 50KB of HTML
        return _extract_metadata(content, result)

    except requests.exceptions.Timeout:
        result["error"] = "Request timed out"
    except requests.exceptions.SSLError:
        result["error"] = "SSL certificate error"
    except requests.exceptions.ConnectionError as e:
        result["error"] = f"Connection failed: {str(e)[:100]}"
    except requests.exceptions.RequestException as e:
        result["error"] = f"Request error: {str(e)[:100]}"

    return result


def _scrape_with_urllib(url: str, timeout: float, result: Dict[str, Any]) -> Dict[str, Any]:
    """Scrape using stdlib urllib (fallback)."""
    try:
        # Set socket timeout
        socket.setdefaulttimeout(timeout)

        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; ClarityBot/1.0)",
        }
        req = Request(url, headers=headers)

        with urlopen(req, timeout=timeout) as response:
            result["status_code"] = response.status
            result["final_url"] = response.url

            if response.status != 200:
                result["error"] = f"HTTP {response.status}"
                return result

            # Read limited content
            content_bytes = response.read(50000)  # Max 50KB
            # Try to decode with fallback
            try:
                content = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content = content_bytes.decode("latin-1", errors="ignore")

            return _extract_metadata(content, result)

    except socket.timeout:
        result["error"] = "Request timed out"
    except HTTPError as e:
        result["status_code"] = e.code
        result["error"] = f"HTTP {e.code}: {e.reason}"
    except URLError as e:
        result["error"] = f"URL error: {str(e.reason)[:100]}"
    except Exception as e:
        result["error"] = f"Scrape error: {str(e)[:100]}"

    return result


def _extract_metadata(html: str, result: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from HTML using regex (no BeautifulSoup dependency)."""

    # Extract <title>
    title_match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE | re.DOTALL)
    if title_match:
        result["title"] = _clean_text(title_match.group(1))[:200]

    # Extract meta description
    desc_match = re.search(
        r'<meta\s+[^>]*name=["\']description["\']\s+[^>]*content=["\']([^"\']+)["\']',
        html,
        re.IGNORECASE,
    )
    if not desc_match:
        # Try alternate attribute order
        desc_match = re.search(
            r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*name=["\']description["\']',
            html,
            re.IGNORECASE,
        )
    if desc_match:
        result["meta_description"] = _clean_text(desc_match.group(1))[:500]

    # Extract first <h1>
    h1_match = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.IGNORECASE | re.DOTALL)
    if h1_match:
        result["h1"] = _clean_text(h1_match.group(1))[:200]

    # Extract visible text snippet
    text_snippet = _extract_visible_text(html)
    if text_snippet:
        result["text_snippet"] = text_snippet[:500]

    return result


def _extract_visible_text(html: str) -> str:
    """Extract visible text from HTML, removing scripts, styles, and tags."""
    # Remove script and style content
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.DOTALL)
    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Clean up whitespace
    text = _clean_text(text)
    return text


def _clean_text(text: str) -> str:
    """Clean and normalize text."""
    if not text:
        return ""
    # Decode HTML entities
    text = text.replace("&nbsp;", " ")
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()
