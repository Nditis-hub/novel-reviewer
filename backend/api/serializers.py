from django.contrib.auth import authenticate
from django.db.models import Avg
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Book, Review, ShelfItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "favorite_genres", "onboarding_completed"]

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name"]


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with that email already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("Incorrect email or password.")
        attrs["user"] = user
        return attrs


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "rating", "text", "created_at", "author_name"]


class ReviewInSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = ["rating", "text"]


class BookSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "title", "author", "year", "pages", "isbn", "genre",
            "cover_color_from", "cover_color_to", "cover_image_url", "description",
            "avg_rating", "review_count",
        ]

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(avg=Avg("rating"))["avg"]
        return round(avg, 2) if avg else 0.0

    def get_review_count(self, obj):
        return obj.reviews.count()


class BookDetailSerializer(BookSerializer):
    reviews = serializers.SerializerMethodField()

    class Meta(BookSerializer.Meta):
        fields = BookSerializer.Meta.fields + ["reviews"]

    def get_reviews(self, obj):
        qs = obj.reviews.select_related("user").order_by("-created_at")
        return ReviewSerializer(qs, many=True).data


class ShelfItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = ShelfItem
        fields = ["book", "status", "progress", "updated_at"]


class ShelfUpsertSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["want", "reading", "read"])


class ShelfPatchSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["want", "reading", "read"], required=False)
    progress = serializers.IntegerField(min_value=0, required=False)

class OnboardingSerializer(serializers.Serializer):
    genres = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    skip = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if not attrs.get("skip") and len(attrs.get("genres", [])) < 3:
            raise serializers.ValidationError("Pick at least 3 genres, or skip.")
        return attrs
    
