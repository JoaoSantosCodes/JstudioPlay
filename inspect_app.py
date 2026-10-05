import jsbeautifier
import os

try:
    with open("d:/Banco de Ideias/M3UPLAY/scraped/static/app.js", "r", encoding="utf-8") as f:
        code = f.read()
    
    # Try beautifying if jsbeautifier is available or do simple formatting
    print("JS length:", len(code))
    # Let's save a copy and search keywords
    print("Keywords check:")
    for kw in ["fetch", "localStorage", "indexedDB", "m3u", "playlist", "api", "stream", "cors", "hls", "xtream"]:
        count = code.lower().count(kw)
        print(f"  - '{kw}': {count} occurrences")

except Exception as e:
    print("Error:", e)
