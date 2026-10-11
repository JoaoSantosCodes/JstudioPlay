import urllib.request
import os
import re
import urllib.parse

BASE_URL = "https://m3uplay.com.br"
OUTPUT_DIR = "d:/Banco de Ideias/M3UPLAY/scraped"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "static"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "static", "fonts"), exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_file(path):
    url = urllib.parse.urljoin(BASE_URL, path)
    clean_path = path.lstrip("/")
    if not clean_path:
        local_path = os.path.join(OUTPUT_DIR, "index.html")
    else:
        local_path = os.path.join(OUTPUT_DIR, clean_path.replace("/", os.sep))
    
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            with open(local_path, "wb") as f:
                f.write(content)
            print(f"[OK] {url} -> {local_path} ({len(content)} bytes)")
            return content
    except Exception as e:
        print(f"[ERR] {url} -> {e}")
        return None

# 1. Download initial files
index_html = download_file("/")
css_content = download_file("/static/styles.css")
js_content = download_file("/static/app.js")
logo_content = download_file("/static/logo.svg")
font_content = download_file("/static/fonts/InterVariable.woff2")
download_file("/manifest.json")
download_file("/robots.txt")
download_file("/favicon.ico")

# 2. Inspect JS and CSS for more URLs
found_urls = set()
if js_content:
    js_text = js_content.decode("utf-8", errors="ignore")
    # find static paths or assets
    matches = re.findall(r'["\'](/static/[^"\']+)["\']', js_text)
    for m in matches:
        found_urls.add(m)

if css_content:
    css_text = css_content.decode("utf-8", errors="ignore")
    matches = re.findall(r'url\(["\']?([^)]+?)["\']?\)', css_text)
    for m in matches:
        if m.startswith("/") or not m.startswith("http"):
            found_urls.add(m if m.startswith("/") else "/static/" + m)

print("\n--- Additional discovered assets ---")
for u in sorted(found_urls):
    print(f"Downloading discovered: {u}")
    download_file(u)

print("\nDone scraping.")
