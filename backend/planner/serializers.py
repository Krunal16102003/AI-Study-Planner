from rest_framework import serializers

from .models import (
    AIRecommendation,
    AIMemory,
    BurnoutSnapshot,
    CareerInterviewSession,
    CareerLearningInsight,
    CareerProjectRecommendation,
    CareerReadinessSnapshot,
    CareerRoadmap,
    CareerRoadmapPhase,
    FocusSession,
    MentorConversation,
    MentorMessage,
    MentorRecommendation,
    Notification,
    PomodoroSession,
    ProgressLog,
    QuizAttempt,
    QuizQuestion,
    StudyGroup,
    StudyInsight,
    StudyGroupMembership,
    StudyPlan,
    StudySession,
    Subject,
    SkillProfile,
    WeakTopic,
)


class OwnedRelationValidatorMixin:
    owned_relation_fields = ()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return attrs

        for field in self.owned_relation_fields:
            related = attrs.get(field)
            if related is not None and getattr(related, "user_id", None) != user.id:
                raise serializers.ValidationError({field: "Invalid selection for this account."})
        return attrs


class WeakTopicSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    owned_relation_fields = ("subject",)

    class Meta:
        model = WeakTopic
        fields = "__all__"
        read_only_fields = ["user"]


class SubjectSerializer(serializers.ModelSerializer):
    weak_topics = WeakTopicSerializer(many=True, read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ["id", "name", "exam_date", "difficulty", "priority", "confidence", "target_score", "weak_topics", "days_remaining"]
        read_only_fields = ["user"]

    def get_days_remaining(self, obj):
        from django.utils import timezone

        return max((obj.exam_date - timezone.localdate()).days, 0)


class StudySessionSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    topic_title = serializers.CharField(source="weak_topic.title", read_only=True)
    owned_relation_fields = ("plan", "subject", "weak_topic")

    class Meta:
        model = StudySession
        fields = "__all__"
        read_only_fields = ["user"]


class StudyPlanSerializer(serializers.ModelSerializer):
    sessions = StudySessionSerializer(many=True, read_only=True)

    class Meta:
        model = StudyPlan
        fields = "__all__"
        read_only_fields = ["user"]


class ProgressLogSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    owned_relation_fields = ("subject", "weak_topic")

    class Meta:
        model = ProgressLog
        fields = "__all__"
        read_only_fields = ["user"]


class QuizQuestionSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    owned_relation_fields = ("subject", "weak_topic")

    class Meta:
        model = QuizQuestion
        fields = "__all__"
        read_only_fields = ["user"]


class AIRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendation
        fields = "__all__"
        read_only_fields = ["user"]


class QuizAttemptSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    topic_title = serializers.CharField(source="weak_topic.title", read_only=True)
    owned_relation_fields = ("subject", "weak_topic")

    class Meta:
        model = QuizAttempt
        fields = "__all__"
        read_only_fields = ["user"]


class BurnoutSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BurnoutSnapshot
        fields = "__all__"
        read_only_fields = ["user"]


class MentorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorMessage
        fields = "__all__"
        read_only_fields = ["user"]


class MentorConversationSerializer(serializers.ModelSerializer):
    messages = MentorMessageSerializer(many=True, read_only=True)

    class Meta:
        model = MentorConversation
        fields = "__all__"
        read_only_fields = ["user"]


class AIMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMemory
        fields = "__all__"
        read_only_fields = ["user"]


class StudyInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyInsight
        fields = "__all__"
        read_only_fields = ["user"]


class MentorRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorRecommendation
        fields = "__all__"
        read_only_fields = ["user"]


class CareerRoadmapPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRoadmapPhase
        fields = "__all__"
        read_only_fields = ["roadmap"]


class SkillProfileSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    owned_relation_fields = ("roadmap",)

    class Meta:
        model = SkillProfile
        fields = "__all__"
        read_only_fields = ["user"]


class CareerProjectRecommendationSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    owned_relation_fields = ("roadmap",)

    class Meta:
        model = CareerProjectRecommendation
        fields = "__all__"
        read_only_fields = ["user"]


class CareerReadinessSnapshotSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    owned_relation_fields = ("roadmap",)

    class Meta:
        model = CareerReadinessSnapshot
        fields = "__all__"
        read_only_fields = ["user"]


class CareerLearningInsightSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    owned_relation_fields = ("roadmap",)

    class Meta:
        model = CareerLearningInsight
        fields = "__all__"
        read_only_fields = ["user"]


class CareerInterviewSessionSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    owned_relation_fields = ("roadmap",)

    class Meta:
        model = CareerInterviewSession
        fields = "__all__"
        read_only_fields = ["user"]


class CareerRoadmapSerializer(serializers.ModelSerializer):
    phases = CareerRoadmapPhaseSerializer(many=True, read_only=True)
    skills = SkillProfileSerializer(many=True, read_only=True)
    project_recommendations = CareerProjectRecommendationSerializer(many=True, read_only=True)
    readiness_snapshots = CareerReadinessSnapshotSerializer(many=True, read_only=True)
    learning_insights = CareerLearningInsightSerializer(many=True, read_only=True)

    class Meta:
        model = CareerRoadmap
        fields = "__all__"
        read_only_fields = ["user"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user"]


class PomodoroSessionSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    owned_relation_fields = ("subject",)

    class Meta:
        model = PomodoroSession
        fields = "__all__"
        read_only_fields = ["user"]


class StudyGroupMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = StudyGroupMembership
        fields = ["id", "user", "username", "role", "joined_at"]
        read_only_fields = ["user"]


class StudyGroupSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    memberships = StudyGroupMembershipSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = "__all__"
        read_only_fields = ["owner", "members"]

    def get_member_count(self, obj):
        return obj.memberships.count()


class FocusSessionSerializer(OwnedRelationValidatorMixin, serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    owned_relation_fields = ("subject",)

    class Meta:
        model = FocusSession
        fields = "__all__"
        read_only_fields = ["user"]
