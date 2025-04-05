import requests
from bs4 import BeautifulSoup

def extract_text_from_url(url):
    try:
        # Step 1: Make a request to the site
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)

        # Step 2: Try JSON first
        try:
            data = response.json()
            return str(data)  # You could also format this better with json.dumps(data, indent=2)
        except ValueError:
            pass  # Not JSON, move on to HTML

        # Step 3: If it's HTML, use BeautifulSoup to parse visible text
        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove scripts, styles, and other non-visible elements
        for tag in soup(['script', 'style', 'header', 'footer', 'nav', 'aside']):
            tag.decompose()

        text = soup.get_text(separator='\n', strip=True)
        return text

    except Exception as e:
        return f"Error fetching or parsing content from {url}:\n{e}"
