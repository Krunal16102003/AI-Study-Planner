from datetime import datetime, time
import json

from django.http import StreamingHttpResponse
from django.db.models import Avg, Count, Sum
from django.db.models import Prefetch
from django.core.cache import cache
from django.utils import timezone
from rest_framework import decorators, response, status, views, viewsets

from .models import (
    AIRecommendation,
    AIMemory,
    BurnoutSnapshot,
    CareerInterviewSession,
    CareerLearningInsight,
    CareerProjectRecommendation,
    CareerReadinessSnapshot,
    CareerRoadmap,
    FocusSession,
    MentorConversation,
    MentorRecommendation,
    Notification,
    PomodoroSession,
    ProgressLog,
    QuizAttempt,
    QuizQuestion,
    StudyGroup,
    StudyGroupMembership,
    StudyInsight,
    StudyPlan,
    StudySession,
    Subject,
    SkillProfile,
    WeakTopic,
)
from .pagination import StudyPlanPagination
from .serializers import (
    AIRecommendationSerializer,
    AIMemorySerializer,
    BurnoutSnapshotSerializer,
    CareerInterviewSessionSerializer,
    CareerLearningInsightSerializer,
    CareerProjectRecommendationSerializer,
    CareerReadinessSnapshotSerializer,
    CareerRoadmapSerializer,
    FocusSessionSerializer,
    MentorConversationSerializer,
    MentorRecommendationSerializer,
    NotificationSerializer,
    PomodoroSessionSerializer,
    ProgressLogSerializer,
    QuizAttemptSerializer,
    QuizQuestionSerializer,
    StudyInsightSerializer,
    StudyGroupSerializer,
    StudyPlanSerializer,
    StudySessionSerializer,
    SubjectSerializer,
    SkillProfileSerializer,
    WeakTopicSerializer,
)
from .services import (
    adaptive_pomodoro_settings,
    burnout_detection,
    calculate_user_stats,
    career_dashboard_payload,
    chatbot_reply,
    daily_study_recommendation,
    evaluate_career_interview,
    focus_mode_summary,
    get_resource_stats,
    _generate_simulated_external_resources, # Import the new helper
    generate_quiz_questions,
    generate_mock_test,
    generate_career_readiness,
    generate_career_roadmap,
    get_performance_metrics,
    generate_study_plan,
    group_leaderboard,
    mentor_reply,
    mentor_room_payload,
    performance_predictions,
    productivity_analytics,
    resource_recommendations,
    revision_recommendations,
    smart_notifications,
    subject_readiness,
    weakness_analysis,
)


class OwnedModelViewSet(viewsets.ModelViewSet):
    def clear_user_cache(self):
        if self.request.user.is_authenticated:
            cache.delete_many([
                f"dashboard:{self.request.user.id}",
                f"analytics:{self.request.user.id}",
            ])

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        self.clear_user_cache()

    def perform_update(self, serializer):
        serializer.save()
        self.clear_user_cache()

    def perform_destroy(self, instance):
        instance.delete()
        self.clear_user_cache()


class SubjectViewSet(OwnedModelViewSet):
    queryset = Subject.objects.all().prefetch_related(
        Prefetch("weak_topics", queryset=WeakTopic.objects.only(
            "id", "user", "subject", "title", "understanding_level", "notes", "is_completed", "resource_url"
        ))
    )
    serializer_class = SubjectSerializer


class WeakTopicViewSet(OwnedModelViewSet):
    queryset = WeakTopic.objects.all().select_related("subject")
    serializer_class = WeakTopicSerializer


class StudyPlanViewSet(OwnedModelViewSet):
    queryset = StudyPlan.objects.all().prefetch_related(
        Prefetch(
            "sessions",
            queryset=StudySession.objects.select_related("subject", "weak_topic").only(
                "id",
                "user",
                "plan",
                "subject",
                "weak_topic",
                "date",
                "start_time",
                "end_time",
                "task_type",
                "title",
                "is_completed",
            ),
        )
    )
    serializer_class = StudyPlanSerializer
    pagination_class = StudyPlanPagination

    @decorators.action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        try:
            start_date = None
            if request.data.get("start_date"):
                start_date = datetime.strptime(request.data["start_date"], "%Y-%m-%d").date()
            plan, _ = generate_study_plan(
                request.user,
                daily_hours=request.data.get("daily_hours"),
                start_date=start_date,
                days=int(request.data.get("days", 7)),
                preferred_study_time=request.data.get("preferred_study_time"),
                break_duration=request.data.get("break_duration"),
                subjects_payload=request.data.get("subjects"),
                plan_title=request.data.get("title"),
            )
        except ValueError as exc:
            return response.Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return response.Response(StudyPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class StudySessionViewSet(OwnedModelViewSet):
    queryset = StudySession.objects.all().select_related("plan", "subject", "weak_topic")
    serializer_class = StudySessionSerializer


class ProgressLogViewSet(OwnedModelViewSet):
    queryset = ProgressLog.objects.all().select_related("subject", "weak_topic")
    serializer_class = ProgressLogSerializer


class QuizQuestionViewSet(OwnedModelViewSet):
    queryset = QuizQuestion.objects.all().select_related("subject", "weak_topic")
    serializer_class = QuizQuestionSerializer

    @decorators.action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        subject = Subject.objects.filter(user=request.user, id=request.data.get("subject")).first()
        if not subject:
            return response.Response({"detail": "Valid subject is required."}, status=400)
        weak_topic = None
        if request.data.get("weak_topic"):
            weak_topic = WeakTopic.objects.filter(
                user=request.user, subject=subject, id=request.data["weak_topic"]
            ).first()
            if not weak_topic:
                return response.Response({"detail": "Valid weak topic is required."}, status=400)
        questions = generate_quiz_questions(
            request.user,
            subject,
            weak_topic,
            int(request.data.get("count", 5)),
            request.data.get("difficulty") or subject.difficulty,
        )
        return response.Response(QuizQuestionSerializer(questions, many=True).data, status=201)


class QuizAttemptViewSet(OwnedModelViewSet):
    queryset = QuizAttempt.objects.all().select_related("subject", "weak_topic")
    serializer_class = QuizAttemptSerializer


class AIRecommendationViewSet(OwnedModelViewSet):
    queryset = AIRecommendation.objects.all()
    serializer_class = AIRecommendationSerializer


class MentorConversationViewSet(OwnedModelViewSet):
    queryset = MentorConversation.objects.all().prefetch_related("messages")
    serializer_class = MentorConversationSerializer

    @decorators.action(detail=True, methods=["post"], url_path="pin")
    def pin(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_pinned = not conversation.is_pinned
        conversation.save(update_fields=["is_pinned", "updated_at"])
        return response.Response(MentorConversationSerializer(conversation).data)


class AIMemoryViewSet(OwnedModelViewSet):
    queryset = AIMemory.objects.all()
    serializer_class = AIMemorySerializer


class StudyInsightViewSet(OwnedModelViewSet):
    queryset = StudyInsight.objects.all()
    serializer_class = StudyInsightSerializer


class MentorRecommendationViewSet(OwnedModelViewSet):
    queryset = MentorRecommendation.objects.all()
    serializer_class = MentorRecommendationSerializer


class CareerRoadmapViewSet(OwnedModelViewSet):
    queryset = CareerRoadmap.objects.all().prefetch_related(
        "phases",
        "skills",
        "project_recommendations",
        "readiness_snapshots",
        "learning_insights",
    )
    serializer_class = CareerRoadmapSerializer

    @decorators.action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        try:
            roadmap = generate_career_roadmap(request.user, request.data)
        except (TypeError, ValueError) as exc:
            return response.Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return response.Response(CareerRoadmapSerializer(roadmap).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"], url_path="refresh-readiness")
    def refresh_readiness(self, request, pk=None):
        snapshot = generate_career_readiness(request.user, self.get_object())
        return response.Response(CareerReadinessSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)


class SkillProfileViewSet(OwnedModelViewSet):
    queryset = SkillProfile.objects.all().select_related("roadmap")
    serializer_class = SkillProfileSerializer


class CareerProjectRecommendationViewSet(OwnedModelViewSet):
    queryset = CareerProjectRecommendation.objects.all().select_related("roadmap")
    serializer_class = CareerProjectRecommendationSerializer


class CareerReadinessSnapshotViewSet(OwnedModelViewSet):
    queryset = CareerReadinessSnapshot.objects.all().select_related("roadmap")
    serializer_class = CareerReadinessSnapshotSerializer


class CareerLearningInsightViewSet(OwnedModelViewSet):
    queryset = CareerLearningInsight.objects.all().select_related("roadmap")
    serializer_class = CareerLearningInsightSerializer


class CareerInterviewSessionViewSet(OwnedModelViewSet):
    queryset = CareerInterviewSession.objects.all().select_related("roadmap")
    serializer_class = CareerInterviewSessionSerializer


class BurnoutSnapshotViewSet(OwnedModelViewSet):
    queryset = BurnoutSnapshot.objects.all()
    serializer_class = BurnoutSnapshotSerializer


class DailyRecommendationView(views.APIView):
    def get(self, request):
        latest = AIRecommendation.objects.filter(user=request.user, source_date=timezone.localdate()).first()
        if latest:
            payload = AIRecommendationSerializer(latest).data
            payload["timeline"] = [
                {"label": "Start", "task": latest.study_order[0] if latest.study_order else latest.study_focus, "minutes": round(latest.estimated_minutes * 0.55)},
                {"label": "Revision", "task": latest.revision_focus or "Quick revision", "minutes": round(latest.estimated_minutes * 0.30)},
                {"label": "Recall", "task": "Active recall check", "minutes": max(10, round(latest.estimated_minutes * 0.15))},
            ]
            return response.Response(payload)
        return response.Response(daily_study_recommendation(request.user, save=True))

    def post(self, request):
        return response.Response(daily_study_recommendation(request.user, save=True), status=status.HTTP_201_CREATED)


class MentorRoomView(views.APIView):
    def get(self, request):
        return response.Response(mentor_room_payload(request.user))


class CareerDashboardView(views.APIView):
    def get(self, request):
        payload = career_dashboard_payload(request.user)
        return response.Response({
            "roadmap": CareerRoadmapSerializer(payload["roadmap"]).data if payload["roadmap"] else None,
            "readiness": CareerReadinessSnapshotSerializer(payload["readiness"]).data if payload["readiness"] else None,
            "skill_gaps": payload["skill_gaps"],
            "projects": CareerProjectRecommendationSerializer(payload["projects"], many=True).data,
            "insights": CareerLearningInsightSerializer(payload["insights"], many=True).data,
            "interview_history": CareerInterviewSessionSerializer(payload["interview_history"], many=True).data,
        })


class CareerInterviewEvaluateView(views.APIView):
    def post(self, request):
        try:
            session = evaluate_career_interview(request.user, request.data)
        except ValueError as exc:
            return response.Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return response.Response(CareerInterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class MentorChatView(views.APIView):
    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return response.Response({"detail": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
        mode = request.data.get("mode", "exam")
        depth = request.data.get("depth", "balanced")
        conversation_id = request.data.get("conversation")
        conversation = None
        if conversation_id:
            conversation = MentorConversation.objects.filter(user=request.user, id=conversation_id).first()
        if not conversation:
            conversation = MentorConversation.objects.create(user=request.user, mode=mode)
        reply = mentor_reply(request.user, message, mode=mode, depth=depth, conversation=conversation)
        return response.Response({
            "reply": reply,
            "conversation": MentorConversationSerializer(conversation).data,
        })


class MentorChatStreamView(views.APIView):
    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return response.Response({"detail": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
        mode = request.data.get("mode", "exam")
        depth = request.data.get("depth", "balanced")
        conversation = MentorConversation.objects.filter(user=request.user, id=request.data.get("conversation")).first()
        if not conversation:
            conversation = MentorConversation.objects.create(user=request.user, mode=mode)
        reply = mentor_reply(request.user, message, mode=mode, depth=depth, conversation=conversation)

        def stream():
            yield f"data: {json.dumps({'conversation_id': conversation.id, 'type': 'meta'})}\n\n"
            for token in reply.split(" "):
                yield f"data: {json.dumps({'token': token + ' ', 'type': 'token'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingHttpResponse(stream(), content_type="text/event-stream")


class MockTestGenerateView(views.APIView):
    def post(self, request):
        payload = generate_mock_test(
            request.user,
            test_type=request.data.get("test_type", "full"),
            subject_id=request.data.get("subject") or None,
            difficulty=request.data.get("difficulty", "medium"),
            question_count=request.data.get("count", 12),
        )
        return response.Response(payload)


class NotificationViewSet(OwnedModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer


class PomodoroSessionViewSet(OwnedModelViewSet):
    queryset = PomodoroSession.objects.all().select_related("subject")
    serializer_class = PomodoroSessionSerializer


class FocusSessionViewSet(OwnedModelViewSet):
    queryset = FocusSession.objects.all().select_related("subject")
    serializer_class = FocusSessionSerializer


class StudyGroupViewSet(viewsets.ModelViewSet):
    serializer_class = StudyGroupSerializer

    def get_queryset(self):
        return StudyGroup.objects.filter(members=self.request.user).prefetch_related("memberships__user")

    def perform_create(self, serializer):
        group = serializer.save(owner=self.request.user)
        StudyGroupMembership.objects.get_or_create(group=group, user=self.request.user, defaults={"role": "owner"})

    @decorators.action(detail=True, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request, pk=None):
        return response.Response({"leaderboard": group_leaderboard(self.get_object())})

    @decorators.action(detail=True, methods=["get"], url_path="shared-schedule")
    def shared_schedule(self, request, pk=None):
        group = self.get_object()
        sessions = StudySession.objects.filter(user__in=group.members.all()).select_related("subject").order_by("date", "start_time")[:20]
        return response.Response(StudySessionSerializer(sessions, many=True).data)


class DashboardView(views.APIView):
    def get(self, request):
        try:
            cache_key = f"dashboard:{request.user.id}"
            cached = cache.get(cache_key)
            if cached is not None:
                cached["success"] = True
                return response.Response(cached)

            subjects = Subject.objects.filter(user=request.user).prefetch_related("weak_topics")
            progress = ProgressLog.objects.filter(user=request.user)
            completed_topics = WeakTopic.objects.filter(user=request.user, is_completed=True).count()
            total_topics = WeakTopic.objects.filter(user=request.user).count()
            quiz_avg = progress.exclude(quiz_score=None).aggregate(avg=Avg("quiz_score")).get("avg", 0) or 0
            study_minutes = progress.aggregate(total=Sum("studied_minutes")).get("total", 0) or 0
            upcoming = subjects.filter(exam_date__gte=timezone.localdate()).order_by("exam_date")[:5]
            subject_stats = []
            readiness_by_subject = []
            gamification = calculate_user_stats(request.user)

            for subject in subjects:
                topic_count = subject.weak_topics.count()
                done = subject.weak_topics.filter(is_completed=True).count()
                completion = round((done / topic_count) * 100) if topic_count else subject.confidence
                readiness = subject_readiness(subject)
                readiness_by_subject.append(readiness)
                subject_stats.append(
                    {
                        "id": subject.id,
                        "name": subject.name,
                        "completion": completion,
                        "days_remaining": max((subject.exam_date - timezone.localdate()).days, 0),
                        "difficulty": subject.difficulty,
                        "readiness": readiness["readiness"],
                        "status": readiness["status"],
                    }
                )

            readiness = (
                round(
                    sum(item["readiness"] for item in readiness_by_subject)
                    / len(readiness_by_subject)
                )
                if readiness_by_subject
                else 0
            )
            readiness = min(readiness, 100)

            payload = {
                "success": True,
                "total_study_hours": round(study_minutes / 60, 1),
                "topics_completed": completed_topics,
                "gamification": gamification,
                "total_topics": total_topics,
                "exam_readiness_score": readiness,
                "average_quiz_score": round(quiz_avg, 1),
                "subject_stats": subject_stats,
                "readiness_by_subject": readiness_by_subject,
                "weakness_analysis": weakness_analysis(request.user)[:5],
                "revision_schedule": revision_recommendations(request.user),
                "upcoming_exams": SubjectSerializer(upcoming, many=True).data,
                "notifications": NotificationSerializer(
                    Notification.objects.filter(user=request.user, is_read=False)[:5],
                    many=True,
                ).data,
                "logs_by_day": list(
                    progress.extra({"day": "date(logged_at)"})
                    .values("day")
                    .annotate(minutes=Sum("studied_minutes"), sessions=Count("id"))
                    .order_by("-day")[:7]
                ),
            }
            cache.set(cache_key, payload, 30)
            return response.Response(payload)
        except Exception as e:
            print(f"DashboardView error: {e}") # Log the error for debugging
            return response.Response(
                {"success": False, "message": "Unable to load dashboard data. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalyticsView(views.APIView):
    def get(self, request):
        try:
            cache_key = f"analytics:{request.user.id}"
            cached = cache.get(cache_key)
            if cached is None:
                cached = productivity_analytics(request.user)
                cached["success"] = True
                cache.set(cache_key, cached, 30)
            else:
                cached["success"] = True
            return response.Response(cached)
        except Exception as e:
            print(f"AnalyticsView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load analytics data. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendationView(views.APIView):
    def get(self, request):
        try:
            return response.Response({"success": True, "recommendations": resource_recommendations(request.user)})
        except Exception as e:
            print(f"RecommendationView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load recommendations. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResourceListView(views.APIView):
    """Returns all intelligently fetched resources"""
    def get(self, request):
        try:
            return response.Response({"success": True, "resources": resource_recommendations(request.user)})
        except Exception as e:
            print(f"ResourceListView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load resource list. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendedResourcesView(views.APIView):
    """Returns AI prioritized resources"""
    def get(self, request):
        try:
            return response.Response({"success": True, "recommended": resource_recommendations(request.user)[:8]})
        except Exception as e:
            print(f"RecommendedResourcesView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load recommended resources. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WeakTopicResourcesView(views.APIView):
    """Returns resources specifically mapped to weak areas"""
    def get(self, request):
        try:
            return response.Response({
                "success": True, 
                "weak_topics": weakness_analysis(request.user)[:5]
            })
        except Exception as e:
            print(f"WeakTopicResourcesView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load weak topic resources. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResourcesDashboardView(views.APIView):
    """Unified endpoint for the premium Resources page"""
    def get(self, request):
        try:
            user = request.user
            resources = resource_recommendations(user)
            stats = get_resource_stats(user)
            
            return response.Response({
                "success": True,
                "stats": stats,
                "resources": resources, # Main list of resources
                "recommended_resources": resources, # Can be a subset if needed, for now same as resources
                "weak_topics": weakness_analysis(user)[:5], # Weak topics for sidebar
                "subjects": SubjectSerializer(Subject.objects.filter(user=user), many=True).data,
                # Frontend compatibility keys for Resources.jsx
                "ai_recommendations": resources[:3], # Top 3 for AI sidebar
                "revision_tasks": revision_recommendations(user, horizon_days=7),
                "all_resources": resources, # For filtering in frontend
            })
        except Exception as e:
            print(f"ResourcesDashboardView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load resources dashboard. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExamCommandView(views.APIView):
    def get(self, request):
        try:
            today = timezone.localdate()
            upcoming = []
            for subject in Subject.objects.filter(user=request.user, exam_date__gte=today).prefetch_related("weak_topics").order_by("exam_date")[:8]:
                readiness = subject_readiness(subject)
                days_remaining = max((subject.exam_date - today).days, 0)
                weak_topics = list(subject.weak_topics.filter(is_completed=False))
                weak_count = len(weak_topics)
                syllabus_completion = readiness["completion"]
                urgency = min(
                    100,
                    max(
                        0,
                        round((100 - readiness["readiness"]) * 0.55 + max(0, 21 - days_remaining) * 2 + weak_count * 6),
                    ),
                )
                forecast = min(
                    100,
                    round(readiness["readiness"] * 0.75 + readiness["quiz_average"] * 0.15 + min(days_remaining, 14) * 0.7),
                )
                predicted_topics = [
                    {
                        "topic_id": topic.id,
                        "topic": topic.title,
                        "importance": min(100, 55 + index * 8 + (20 if topic.understanding_level == "weak" else 0)),
                    }
                    for index, topic in enumerate(weak_topics[:5])
                ]
                strategy = [
                    {
                        "title": "Stabilize weak topics",
                        "detail": "Start with the lowest-readiness areas before broad revision.",
                    },
                    {
                        "title": "Run active recall",
                        "detail": "Use short quizzes after each study block to lock concepts in.",
                    },
                    {
                        "title": "Protect recovery",
                        "detail": "Keep breaks scheduled so final-week focus stays consistent.",
                    },
                ]
                upcoming.append(
                    {
                        "subject_id": subject.id,
                        "subject_name": subject.name,
                        "exam_date": subject.exam_date.isoformat(),
                        "exam_date_iso": timezone.make_aware(datetime.combine(subject.exam_date, time.min)).isoformat(),
                        "days_remaining": days_remaining,
                        "readiness": readiness["readiness"],
                        "urgency_score": urgency,
                        "pressure_analysis": f"{subject.name} is {readiness['status'].lower()} with {days_remaining} day(s) remaining.",
                        "syllabus_completion_pct": syllabus_completion,
                        "syllabus_completion_reason": f"{syllabus_completion}% topic completion from your weak-topic tracker.",
                        "forecast_score": forecast,
                        "forecast_reason": "Forecast blends readiness, quiz average, and remaining prep time.",
                        "ai_strategy": strategy,
                        "predicted_topics": predicted_topics,
                        "last_minute_plan": build_last_minute_plan(subject, weak_topics),
                    }
                )

            return response.Response({"success": True, "upcoming_exams": upcoming})
        except Exception as exc:
            print(f"ExamCommandView error: {exc}")
            return response.Response(
                {"success": False, "detail": "Unable to load exam command data."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LastMinutePlanView(views.APIView):
    def post(self, request):
        subject_id = request.data.get("exam_subject_id")
        horizon_days = int(request.data.get("horizon_days") or 7)
        subject = Subject.objects.filter(user=request.user, id=subject_id).prefetch_related("weak_topics").first()
        if not subject:
            return response.Response({"detail": "Valid exam subject is required."}, status=status.HTTP_400_BAD_REQUEST)
        weak_topics = list(subject.weak_topics.filter(is_completed=False))
        return response.Response({"success": True, "last_minute_plan": build_last_minute_plan(subject, weak_topics, horizon_days)})


def build_last_minute_plan(subject, weak_topics, horizon_days=7):
    focus_topics = [topic.title for topic in weak_topics[:horizon_days]] or ["Core concepts", "Formula recall", "Mixed practice"]
    plan = []
    for index in range(max(1, min(horizon_days, 7))):
        topic = focus_topics[index % len(focus_topics)]
        plan.append(
            {
                "day_label": f"Day {index + 1}",
                "focus": f"{subject.name}: revise {topic}, complete one active-recall set, then review mistakes.",
            }
        )
    return plan


class PerformanceTrackingView(views.APIView):
    def get(self, request):
        try:
            return response.Response({"success": True, "metrics": get_performance_metrics(request.user)})
        except Exception as e:
            print(f"PerformanceTrackingView error: {e}")
            return response.Response(
                {"success": False, "message": "Unable to load performance metrics. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatbotView(views.APIView):
    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return response.Response({"detail": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
        mode = request.data.get("mode", "quick")
        depth = request.data.get("depth", "balanced")
        return response.Response({"reply": mentor_reply(request.user, message, mode=mode, depth=depth)})


class PomodoroRecommendationView(views.APIView):
    def get(self, request):
        return response.Response(adaptive_pomodoro_settings(request.user))


class BurnoutView(views.APIView):
    def get(self, request):
        return response.Response(burnout_detection(request.user))


class PerformancePredictionView(views.APIView):
    def get(self, request):
        return response.Response({"predictions": performance_predictions(request.user)})


class SmartNotificationView(views.APIView):
    def post(self, request):
        notifications = smart_notifications(request.user)
        return response.Response(NotificationSerializer(notifications, many=True).data)


class FocusSummaryView(views.APIView):
    def get(self, request):
        return response.Response(focus_mode_summary(request.user))
