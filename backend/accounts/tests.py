from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase


class PasswordResetSecurityTests(APITestCase):
    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=False)
    def test_password_reset_does_not_expose_token_in_production(self):
        User.objects.create_user(username="krunal", email="krunal@example.com", password="StrongPass123!")

        response = self.client.post("/api/auth/password-reset/", {"email": "krunal@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("uid", response.data)
        self.assertNotIn("token", response.data)


class CurrentUserProfileTests(APITestCase):
    def authenticate(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    @override_settings(SECURE_SSL_REDIRECT=False)
    def test_profile_endpoint_returns_only_authenticated_users_profile(self):
        krunal = User.objects.create_user(username="krunal", email="krunal@example.com", password="StrongPass123!")
        other = User.objects.create_user(username="maya", email="maya@example.com", password="StrongPass123!")
        krunal.profile.full_name = "Krunal Patil"
        krunal.profile.bio = "Building AI SaaS."
        krunal.profile.save()
        other.profile.full_name = "Maya Shah"
        other.profile.save()

        self.authenticate(krunal)
        response = self.client.get("/api/auth/profile/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "krunal")
        self.assertEqual(response.data["email"], "krunal@example.com")
        self.assertEqual(response.data["full_name"], "Krunal Patil")
        self.assertNotEqual(response.data["full_name"], "Maya Shah")

    @override_settings(SECURE_SSL_REDIRECT=False)
    def test_profile_update_is_scoped_to_current_user(self):
        krunal = User.objects.create_user(username="krunal", email="krunal@example.com", password="StrongPass123!")
        other = User.objects.create_user(username="maya", email="maya@example.com", password="StrongPass123!")
        other.profile.full_name = "Maya Shah"
        other.profile.save()

        self.authenticate(krunal)
        response = self.client.patch(
            "/api/auth/profile/",
            {
                "full_name": "Krunal Patil",
                "bio": "Full stack developer",
                "career_goal": "Senior Full Stack Engineer",
                "portfolio": "https://krunal.dev",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        krunal.profile.refresh_from_db()
        other.profile.refresh_from_db()
        self.assertEqual(krunal.profile.full_name, "Krunal Patil")
        self.assertEqual(krunal.profile.career_goal, "Senior Full Stack Engineer")
        self.assertEqual(other.profile.full_name, "Maya Shah")
