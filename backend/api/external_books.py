import os
import requests

from .genre_colors import normalize_genre, colors_for_genre

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_URL = "https://openlibrary.org/search.json"
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")


def _parse_year(date_str):
    if not date_str:
        return None
    try:
        return int(str(date_str)[:4])
    except ValueError:
        return None


def search_google_books(query, max_results=10):
    params = {"q": query, "maxResults": max_results}
    if GOOGLE_BOOKS_API_KEY:
        params["key"] = GOOGLE_BOOKS_API_KEY
    resp = requests.get(GOOGLE_BOOKS_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("items", []):
        vi = item.get("volumeInfo", {})
        isbn = None
        for kind in ("ISBN_13", "ISBN_10"):
            for ident in vi.get("industryIdentifiers", []):
                if ident.get("type") == kind:
                    isbn = ident.get("identifier")
                    break
            if isbn:
                break

        genre = normalize_genre(vi.get("categories"))
        color_from, color_to = colors_for_genre(genre)

        image_links = vi.get("imageLinks") or {}
        cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail") or ""
        if cover_url.startswith("http://"):
            cover_url = "https://" + cover_url[len("http://"):]

        results.append({
            "title": vi.get("title") or "Untitled",
            "author": ", ".join(vi.get("authors", [])) or "Unknown",
            "year": _parse_year(vi.get("publishedDate")),
            "pages": vi.get("pageCount"),
            "isbn": isbn,
            "genre": genre,
            "description": (vi.get("description") or "")[:800],
            "cover_color_from": color_from,
            "cover_color_to": color_to,
            "cover_image_url": cover_url,
            "source": "google_books",
            "external_id": item.get("id"),
        })
    return results


def search_open_library(query, max_results=10):
    params = {"q": query, "limit": max_results}
    resp = requests.get(OPEN_LIBRARY_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for doc in data.get("docs", []):
        isbn_list = doc.get("isbn") or []
        genre = normalize_genre(doc.get("subject"))
        color_from, color_to = colors_for_genre(genre)

        cover_url = ""
        if isbn_list:
            cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn_list[0]}-M.jpg"
        elif doc.get("cover_i"):
            cover_url = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"

        results.append({
            "title": doc.get("title") or "Untitled",
            "author": ", ".join(doc.get("author_name", [])) or "Unknown",
            "year": doc.get("first_publish_year"),
            "pages": doc.get("number_of_pages_median"),
            "isbn": isbn_list[0] if isbn_list else None,
            "genre": genre,
            "description": "",
            "cover_color_from": color_from,
            "cover_color_to": color_to,
            "cover_image_url": cover_url,
            "source": "open_library",
            "external_id": doc.get("key"),
        })
    return results