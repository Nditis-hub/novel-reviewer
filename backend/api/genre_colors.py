GENRE_COLORS = {
    "Fantasy": ("#5B3E8C", "#1F6E52"),
    "Sci-Fi": ("#0E5C68", "#123B6B"),
    "Mystery": ("#2B2320", "#5C1E28"),
    "Literary Fiction": ("#7A5A22", "#3E4A22"),
    "Historical Fiction": ("#5A3B22", "#8A6135"),
    "Horror": ("#161414", "#6E1F1F"),
    "Romance": ("#8C3A52", "#C77A6C"),
    "Nonfiction": ("#1B2E4A", "#B8862F"),
    "African Literature": ("#B5651D", "#6B3E26"),
    "Young Adult": ("#2E8B87", "#E8735A"),
    "Poetry": ("#6B4E71", "#9B7EBD"),
    "Contemporary Fiction": ("#3E5C50", "#7A9E8E"),
    "LGBTQ+ Fiction": ("#8E4A85", "#E0A9D6"),
    "Latin American Literature": ("#A13D2B", "#E8A33D"),
    "Asian Literature": ("#8B1E3F", "#D4AF37"),
    "Fiction": ("#4A4458", "#6B6478"),
}
DEFAULT_COLOR = ("#6B4A57", "#9C6B7C")

GENRE_LIST = [g for g in GENRE_COLORS.keys() if g != "Fiction"]

GENRE_SEARCH_QUERY = {
    "Fantasy": "subject:fantasy",
    "Sci-Fi": 'subject:"science fiction"',
    "Mystery": "subject:mystery",
    "Literary Fiction": 'subject:"literary fiction"',
    "Historical Fiction": 'subject:"historical fiction"',
    "Horror": "subject:horror",
    "Romance": "subject:romance",
    "Nonfiction": "subject:nonfiction",
    "African Literature": 'subject:"african literature"',
    "Young Adult": 'subject:"young adult fiction"',
    "Poetry": "subject:poetry",
    "Contemporary Fiction": 'subject:"contemporary fiction"',
    "LGBTQ+ Fiction": 'subject:"lgbtq fiction"',
    "Latin American Literature": 'subject:"latin american fiction"',
    "Asian Literature": 'subject:"asian literature"',
}


def normalize_genre(raw_categories):
    text = " ".join(raw_categories or []).lower()
    checks = [
        ("African Literature", ["african literature", "african fiction", "african american fiction", "nigerian fiction"]),
        ("Young Adult", ["young adult", "juvenile fiction", "teen fiction"]),
        ("Poetry", ["poetry", "poems"]),
        ("LGBTQ+ Fiction", ["lgbt", "lgbtq", "gay fiction", "lesbian fiction", "queer fiction", "transgender"]),
        ("Latin American Literature", ["latin american", "latino fiction", "hispanic american fiction"]),
        ("Asian Literature", ["asian literature", "asian american fiction", "chinese fiction", "japanese fiction", "korean fiction", "south asian fiction", "indian fiction"]),
        ("Fantasy", ["fantasy", "magic", "sword and sorcery"]),
        ("Sci-Fi", ["science fiction", "sci-fi", "dystopia", "space opera"]),
        ("Mystery", ["mystery", "detective", "crime", "thriller", "suspense", "noir"]),
        ("Romance", ["romance"]),
        ("Horror", ["horror", "gothic", "supernatural", "occult", "ghost stories"]),
        ("Historical Fiction", ["historical fiction", "historical", "war fiction", "classic literature", "classics"]),
        ("Nonfiction", ["biography", "autobiography", "nonfiction", "non-fiction", "memoir", "history", "self-help", "business", "true crime", "essays"]),
        ("Contemporary Fiction", ["contemporary fiction", "contemporary women"]),
        ("Literary Fiction", ["literary fiction", "literary collections", "general fiction"]),
    ]
    for genre, keywords in checks:
        if any(k in text for k in keywords):
            return genre
    return "Fiction"


def colors_for_genre(genre):
    return GENRE_COLORS.get(genre, DEFAULT_COLOR)