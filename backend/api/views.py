from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, ShelfItem, Review
from .serializers import (
    SignupSerializer, LoginSerializer, UserSerializer, UserUpdateSerializer, tokens_for_user,
    BookSerializer, BookDetailSerializer, ReviewInSerializer,
    ShelfItemSerializer, ShelfUpsertSerializer, ShelfPatchSerializer,
    OnboardingSerializer,
)
from .genre_colors import GENRE_SEARCH_QUERY
from .external_books import search_google_books, search_open_library
from .services import insert_book_if_new

STATUS_WEIGHT = {"want": 1, "reading": 2, "read": 3}
GENRE_HEAD_START = 3


# ---------------- auth ----------------
class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"access_token": tokens_for_user(user), "token_type": "bearer", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(
            {"access_token": tokens_for_user(user), "token_type": "bearer", "user": UserSerializer(user).data}
        )


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=204)

class OnboardingView(APIView):
    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        genres = serializer.validated_data.get("genres", [])
        skip = serializer.validated_data.get("skip", False)

        user = request.user
        user.favorite_genres = [] if skip else genres
        user.onboarding_completed = True
        user.save()

        if not skip:
            for genre in genres:
                query = GENRE_SEARCH_QUERY.get(genre)
                if not query:
                    continue
                try:
                    candidates = search_google_books(query, max_results=8)
                except Exception:
                    continue
                added = 0
                for payload in candidates:
                    if added >= 4:
                        break
                    if not payload["description"] or not payload["pages"]:
                        continue
                    _, created = insert_book_if_new(payload)
                    if created:
                        added += 1

        return Response(UserSerializer(user).data)


# ---------------- books ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_books(request):
    qs = Book.objects.all()
    search = request.query_params.get("search")
    genre = request.query_params.get("genre")
    sort = request.query_params.get("sort", "rating")

    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search))
    if genre:
        qs = qs.filter(genre=genre)

    serialized = list(BookSerializer(qs, many=True).data)

    if sort == "newest":
        serialized.sort(key=lambda b: b["year"] or 0, reverse=True)
    elif sort == "az":
        serialized.sort(key=lambda b: b["title"].lower())
    else:
        serialized.sort(key=lambda b: b["avg_rating"], reverse=True)

    return Response(serialized)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def trending_books(request):
    genre = request.query_params.get("genre")
    limit = int(request.query_params.get("limit", 10))
    qs = Book.objects.all()
    if genre:
        qs = qs.filter(genre=genre)
    serialized = list(BookSerializer(qs, many=True).data)
    serialized.sort(key=lambda b: (b["avg_rating"], b["review_count"]), reverse=True)
    return Response(serialized[:limit])


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_genres(request):
    genres = sorted(set(Book.objects.values_list("genre", flat=True)))
    return Response(genres)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def get_book(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({"detail": "Book not found."}, status=404)
    return Response(BookDetailSerializer(book).data)


# ---------------- reviews ----------------
class PostReviewView(APIView):
    def post(self, request, book_id):
        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found."}, status=404)
        serializer = ReviewInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = Review.objects.create(book=book, user=request.user, **serializer.validated_data)
        return Response(
            {
                "id": review.id,
                "rating": review.rating,
                "text": review.text,
                "created_at": review.created_at,
                "author_name": request.user.name,
            },
            status=201,
        )


# ---------------- shelf ----------------
class ShelfView(APIView):
    def get(self, request):
        items = ShelfItem.objects.filter(user=request.user).select_related("book")
        return Response(ShelfItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = ShelfUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            book = Book.objects.get(id=serializer.validated_data["book_id"])
        except Book.DoesNotExist:
            return Response({"detail": "Book not found."}, status=404)

        item, _ = ShelfItem.objects.get_or_create(user=request.user, book=book)
        item.status = serializer.validated_data["status"]
        item.save()
        return Response(ShelfItemSerializer(item).data, status=201)


class ShelfItemDetailView(APIView):
    def patch(self, request, book_id):
        try:
            item = ShelfItem.objects.get(user=request.user, book_id=book_id)
        except ShelfItem.DoesNotExist:
            return Response({"detail": "This book is not on your shelf."}, status=404)
        serializer = ShelfPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(item, field, value)
        item.save()
        return Response(ShelfItemSerializer(item).data)

    def delete(self, request, book_id):
        ShelfItem.objects.filter(user=request.user, book_id=book_id).delete()
        return Response(status=204)


# ---------------- recommendations ----------------
class RecommendationsView(APIView):
    def get(self, request):
        user = request.user
        shelf_items = ShelfItem.objects.filter(user=user).select_related("book")
        reviews = Review.objects.filter(user=user).select_related("book")
        owned_ids = {item.book_id for item in shelf_items}

        scores = {}
        for genre in user.favorite_genres or []:
            scores[genre] = scores.get(genre, 0) + GENRE_HEAD_START
        for item in shelf_items:
            if item.book.genre:
                scores[item.book.genre] = scores.get(item.book.genre, 0) + STATUS_WEIGHT.get(item.status, 1)
        for review in reviews:
            if review.book.genre:
                scores[review.book.genre] = scores.get(review.book.genre, 0) + review.rating

        if scores:
            top_genres = [g for g, _ in sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:2]]
            note = (
                "Matched to your shelf: mostly " + " and ".join(top_genres) +
                ", based on what you've added and rated. Genre and history only, no AI involved."
            )
        else:
            top_genres = []
            note = "Add a few books to your shelf and rate them, and this will match your genres. For now, here's what's around."

        if top_genres:
            pool = [
                b for b in BookSerializer(Book.objects.filter(genre__in=top_genres), many=True).data
                if b["id"] not in owned_ids
            ]
            if len(pool) < 8:
                for genre in top_genres:
                    query = GENRE_SEARCH_QUERY.get(genre)
                    if not query:
                        continue
                    try:
                        candidates = search_google_books(query, max_results=8)
                    except Exception:
                        continue
                    for payload in candidates:
                        if not payload["description"] or not payload["pages"]:
                            continue
                        book, created = insert_book_if_new(payload)
                        if created:
                            pool.append(BookSerializer(book).data)
        else:
            pool = [b for b in BookSerializer(Book.objects.all(), many=True).data if b["id"] not in owned_ids]

        pool.sort(key=lambda b: b["avg_rating"], reverse=True)
        return Response({"note": note, "books": pool[:8]})

# ---------------- external search / import ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def search_external(request):
    q = request.query_params.get("q", "").strip()
    source = request.query_params.get("source", "google")
    max_results = int(request.query_params.get("max_results", 10))
    if not q:
        return Response([])

    fn = search_open_library if source == "openlibrary" else search_google_books
    try:
        candidates = fn(q, max_results=max_results)
    except Exception as exc:
        return Response({"detail": f"Could not reach {source}: {exc}"}, status=502)

    isbns = {c["isbn"] for c in candidates if c.get("isbn")}
    existing_isbns = set(Book.objects.filter(isbn__in=list(isbns)).values_list("isbn", flat=True)) if isbns else set()
    for c in candidates:
        c["already_in_library"] = bool(c.get("isbn")) and c["isbn"] in existing_isbns

    return Response(candidates)


class ImportBookView(APIView):
    def post(self, request):
        book, created = insert_book_if_new(request.data)
        return Response(
            {"book": BookSerializer(book).data, "created": created},
            status=201 if created else 200,
        )