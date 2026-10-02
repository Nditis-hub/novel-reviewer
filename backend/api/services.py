from .models import Book


def insert_book_if_new(payload):
    """Returns (book, created). Skips books that already exist."""
    title = (payload.get("title") or "Untitled")[:255]
    author = (payload.get("author") or "Unknown")[:180]
    isbn = (payload.get("isbn") or "")[:32]

    existing = None
    if isbn:
        existing = Book.objects.filter(isbn=isbn).first()
    if not existing:
        existing = Book.objects.filter(title__iexact=title, author__iexact=author).first()
    if existing:
        return existing, False

    book = Book.objects.create(
        title=title,
        author=author,
        year=payload.get("year"),
        pages=payload.get("pages"),
        isbn=isbn,
        genre=payload.get("genre") or "Literary Fiction",
        cover_color_from=payload.get("cover_color_from") or "#8C3A52",
        cover_color_to=payload.get("cover_color_to") or "#C77A6C",
        cover_image_url=payload.get("cover_image_url") or "",
        description=payload.get("description") or "",
    )
    return book, True