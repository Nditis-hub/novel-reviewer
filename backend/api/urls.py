from django.urls import path
from . import views

urlpatterns = [
    path("auth/signup", views.SignupView.as_view()),
    path("auth/login", views.LoginView.as_view()),
    path("auth/me", views.MeView.as_view()),
    path("auth/onboarding", views.OnboardingView.as_view()),

    path("books", views.list_books),
    path("books/trending", views.trending_books),
    path("books/genres", views.list_genres),
    path("books/<int:book_id>", views.get_book),
    path("books/<int:book_id>/reviews", views.PostReviewView.as_view()),
    path("books/search-external", views.search_external),
    path("books/import", views.ImportBookView.as_view()),

    path("shelf", views.ShelfView.as_view()),
    path("shelf/<int:book_id>", views.ShelfItemDetailView.as_view()),

    path("recommendations", views.RecommendationsView.as_view()),
]