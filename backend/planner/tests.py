from datetime import date, time

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import StudyPlan, Subject


@override_settings(SECURE_SSL_REDIRECT=False)
class TenantIsolationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="StrongPass123!")
        self.attacker = User.objects.create_user(username="attacker", password="StrongPass123!")
        self.owner_subject = Subject.objects.create(
            user=self.owner,
            name="Physics",
            exam_date=date(2026, 10, 10),
            difficulty="medium",
            priority="high",
        )
        self.owner_plan = StudyPlan.objects.create(
            user=self.owner,
            title="Owner plan",
            start_date=date(2026, 5, 19),
            end_date=date(2026, 5, 25),
            daily_hours=2,
        )
        self.client.force_authenticate(self.attacker)

    def test_cannot_create_weak_topic_for_another_users_subject(self):
        response = self.client.post(
            "/api/weak-topics/",
            {
                "subject": self.owner_subject.id,
                "title": "Secret topic",
                "understanding_level": "weak",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("subject", response.data)

    def test_cannot_create_session_for_another_users_plan(self):
        response = self.client.post(
            "/api/study-sessions/",
            {
                "plan": self.owner_plan.id,
                "subject": self.owner_subject.id,
                "date": "2026-05-20",
                "start_time": time(10, 0).isoformat(),
                "end_time": time(11, 0).isoformat(),
                "task_type": "study",
                "title": "Cross tenant session",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("plan", response.data)
