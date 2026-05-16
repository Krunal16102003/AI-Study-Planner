from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import PasswordResetConfirmView, PasswordResetRequestView, RegisterView, ProfileView
from planner.views import (
    AIRecommendationViewSet,
    AIMemoryViewSet,
    AnalyticsView,
    BurnoutSnapshotViewSet,
    BurnoutView,
    CareerDashboardView,
    CareerInterviewEvaluateView,
    CareerInterviewSessionViewSet,
    CareerLearningInsightViewSet,
    CareerProjectRecommendationViewSet,
    CareerReadinessSnapshotViewSet,
    CareerRoadmapViewSet,
    ChatbotView,
    DailyRecommendationView,
    DashboardView,
    ExamCommandView,
    FocusSessionViewSet,
    FocusSummaryView,
    LastMinutePlanView,
    MentorChatStreamView,
    MentorChatView,
    MentorConversationViewSet,
    MentorRecommendationViewSet,
    MentorRoomView,
    MockTestGenerateView,
    NotificationViewSet,
    PerformancePredictionView,
    PomodoroRecommendationView,
    PomodoroSessionViewSet,
    ProgressLogViewSet,
    QuizAttemptViewSet,
    QuizQuestionViewSet,
    RecommendationView,
    SmartNotificationView,
    SkillProfileViewSet,
    StudyInsightViewSet,
    StudyGroupViewSet,
    StudyPlanViewSet,
    StudySessionViewSet,
    SubjectViewSet,
    WeakTopicViewSet,
)

router = DefaultRouter()
router.register("subjects", SubjectViewSet, basename="subject")
router.register("weak-topics", WeakTopicViewSet, basename="weak-topic")
router.register("study-plans", StudyPlanViewSet, basename="study-plan")
router.register("study-sessions", StudySessionViewSet, basename="study-session")
router.register("progress-logs", ProgressLogViewSet, basename="progress-log")
router.register("quizzes", QuizQuestionViewSet, basename="quiz")
router.register("quiz-attempts", QuizAttemptViewSet, basename="quiz-attempt")
router.register("ai-recommendations", AIRecommendationViewSet, basename="ai-recommendation")
router.register("mentor-conversations", MentorConversationViewSet, basename="mentor-conversation")
router.register("mentor-memories", AIMemoryViewSet, basename="mentor-memory")
router.register("mentor-insights", StudyInsightViewSet, basename="mentor-insight")
router.register("mentor-recommendations", MentorRecommendationViewSet, basename="mentor-recommendation")
router.register("burnout-snapshots", BurnoutSnapshotViewSet, basename="burnout-snapshot")
router.register("career-roadmaps", CareerRoadmapViewSet, basename="career-roadmap")
router.register("career-skills", SkillProfileViewSet, basename="career-skill")
router.register("career-projects", CareerProjectRecommendationViewSet, basename="career-project")
router.register("career-readiness", CareerReadinessSnapshotViewSet, basename="career-readiness")
router.register("career-insights", CareerLearningInsightViewSet, basename="career-insight")
router.register("career-interviews", CareerInterviewSessionViewSet, basename="career-interview")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("pomodoro-sessions", PomodoroSessionViewSet, basename="pomodoro-session")
router.register("focus-sessions", FocusSessionViewSet, basename="focus-session")
router.register("study-groups", StudyGroupViewSet, basename="study-group")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/profile/", ProfileView.as_view(), name="profile"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/exam-command/", ExamCommandView.as_view(), name="exam_command"),
    path("api/exam-command/generate-last-minute/", LastMinutePlanView.as_view(), name="exam_command_generate_last_minute"),
    path("api/mock-tests/generate/", MockTestGenerateView.as_view(), name="mock_tests_generate"),
    path("api/analytics/", AnalyticsView.as_view(), name="analytics"),
    path("api/recommendations/", RecommendationView.as_view(), name="recommendations"),
    path("api/daily-recommendation/", DailyRecommendationView.as_view(), name="daily_recommendation"),
    path("api/chatbot/", ChatbotView.as_view(), name="chatbot"),
    path("api/mentor-room/", MentorRoomView.as_view(), name="mentor_room"),
    path("api/career-dashboard/", CareerDashboardView.as_view(), name="career_dashboard"),
    path("api/career-interview/evaluate/", CareerInterviewEvaluateView.as_view(), name="career_interview_evaluate"),
    path("api/mentor-chat/", MentorChatView.as_view(), name="mentor_chat"),
    path("api/mentor-chat/stream/", MentorChatStreamView.as_view(), name="mentor_chat_stream"),
    path("api/pomodoro/recommendation/", PomodoroRecommendationView.as_view(), name="pomodoro_recommendation"),
    path("api/burnout/", BurnoutView.as_view(), name="burnout"),
    path("api/performance-predictions/", PerformancePredictionView.as_view(), name="performance_predictions"),
    path("api/smart-notifications/", SmartNotificationView.as_view(), name="smart_notifications"),
    path("api/focus-summary/", FocusSummaryView.as_view(), name="focus_summary"),
    path("api/resources/", include("planner.resource_urls")), # NEW: Include resource-specific URLs
    path("api/", include(router.urls)),
]
