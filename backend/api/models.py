from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(email=self.normalize_email(email), name=name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=80)
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    favorite_genres = models.JSONField(default=list, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email


class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=180)
    year = models.IntegerField(null=True, blank=True)
    pages = models.IntegerField(null=True, blank=True)
    isbn = models.CharField(max_length=32, blank=True)
    genre = models.CharField(max_length=60, db_index=True)
    cover_color_from = models.CharField(max_length=20, default="#8C3A52")
    cover_color_to = models.CharField(max_length=20, default="#C77A6C")
    cover_image_url = models.URLField(blank=True, default="")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Review(models.Model):
    book = models.ForeignKey(Book, related_name="reviews", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="reviews", on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    text = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)


class ShelfItem(models.Model):
    STATUS_CHOICES = [("want", "Want to read"), ("reading", "Currently reading"), ("read", "Read")]

    user = models.ForeignKey(User, related_name="shelf_items", on_delete=models.CASCADE)
    book = models.ForeignKey(Book, related_name="shelf_items", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="want")
    progress = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "book")