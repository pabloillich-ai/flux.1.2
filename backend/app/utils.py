import requests
import re
from bs4 import BeautifulSoup
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global cache
_rates_cache = {
    "data": None,
    "timestamp": 0
}
CACHE_DURATION = 3600  # 1 hour

def get_brou_rates():
    """
    Scrapes the official BROU website for 'Dólar e-BROU' rates.
    Returns a dictionary with 'compra' and 'venta' as floats.
    Uses caching to avoid excessive requests.
    """
    global _rates_cache
    
    # Check cache
    if _rates_cache["data"] and (time.time() - _rates_cache["timestamp"] < CACHE_DURATION):
        return _rates_cache["data"]

    url = "https://www.brou.com.uy/cotizaciones"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": url
    }

    try:
        logger.info("Fetching BROU rates...")
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Extract the dynamic Portlet URL
        # Pattern looks for url:"...cotizacionfull..."
        pattern = r'url:"([^"]*cotizacionfull[^"]*)"'
        match = re.search(pattern, response.text)

        if not match:
            logger.warning("Could not find BROU portlet URL. Page structure might have changed.")
            # Fallback based on typical spread if we can't scrape
            return {"compra": 41.0, "venta": 43.0}

        raw_portlet_url = match.group(1)
        # Decode the URL (remove \x escaping)
        portlet_url = raw_portlet_url.replace(r'\x2f', '/').replace(r'\x3f', '?').replace(r'\x3d', '=').replace(r'\x26', '&').replace(r'\x25', '%')
        full_url = "https://www.brou.com.uy" + portlet_url

        # Fetch the portlet content
        p_response = session.post(full_url, headers=headers, timeout=10)
        if p_response.status_code != 200:
             p_response = session.get(full_url, headers=headers, timeout=10)
        
        p_response.raise_for_status()
        p_response.encoding = 'utf-8' # Ensure correct encoding for "Dólar"

        soup = BeautifulSoup(p_response.text, 'html.parser')

        # Find the row usually containing "Dólar eBROU"
        # We look for a 'p' with class 'moneda' that contains 'eBROU'
        target_el = soup.find('p', class_='moneda', string=re.compile("eBROU"))
        
        if not target_el:
            # Try wider search
            target_el = soup.find(string=re.compile("Dólar eBROU"))

        if not target_el:
             logger.error("Could not find 'Dólar eBROU' element in parsed HTML.")
             # Fallback
             return {"compra": 42.0, "venta": 43.5}

        # Navigate UP to the row (tr)
        row = target_el.find_parent('tr')
        if not row:
            logger.error("Found label but not the parent row.")
            return {"compra": 42.0, "venta": 43.5}

        cols = row.find_all('td')
        # Structure: [Name, Spacer, Buy, Spacer, Sell, ...]
        if len(cols) < 5:
            logger.error("Table structure unexpected (too few columns).")
            return {"compra": 42.0, "venta": 43.5}

        # Extract text, remove commas
        buy_text = cols[2].get_text(strip=True).replace(',', '.')
        sell_text = cols[4].get_text(strip=True).replace(',', '.')

        # Parse
        try:
            buy_val = float(buy_text)
            sell_val = float(sell_text)
        except ValueError:
            logger.error(f"Could not parse values: {buy_text}, {sell_text}")
            return {"compra": 42.0, "venta": 43.5}

        result = {"compra": buy_val, "venta": sell_val}
        
        # Update cache
        _rates_cache["data"] = result
        _rates_cache["timestamp"] = time.time()
        
        logger.info(f"Updated BROU rates: {result}")
        return result

    except Exception as e:
        logger.error(f"Error scraping BROU: {e}")
        # Return last cached if available, else hard fallback
        if _rates_cache["data"]:
            return _rates_cache["data"]
        return {"compra": 42.0, "venta": 43.5}

def get_current_uyu_rate():
    """Returns the 'venta' rate for USD to UYU conversion."""
    rates = get_brou_rates()
    return rates.get('venta', 42.0)
