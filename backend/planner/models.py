from django.conf import settings
from django.db import models


class Subject(models.Model):
    DIFFICULTY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]
    PRIORITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    exam_date = models.DateField(db_index=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="medium", db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium", db_index=True)
    confidence = models.PositiveSmallIntegerField(default=50)
    target_score = models.PositiveSmallIntegerField(default=90)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["exam_date", "name"]
        unique_together = ("user", "name")
        indexes = [
            models.Index(fields=["user", "exam_date"]),
            models.Index(fields=["user", "priority"]),
        ]

    def __str__(self):
        return self.name


class WeakTopic(models.Model):
    LEVEL_CHOICES = [("weak", "Weak"), ("medium", "Medium"), ("strong", "Strong")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, related_name="weak_topics", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    understanding_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="weak", db_index=True)
    resource_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["subject__exam_date", "title"]
        indexes = [
            models.Index(fields=["user", "is_completed"]),
            models.Index(fields=["subject", "is_completed"]),
        ]

    def __str__(self):
        return f"{self.subject.name}: {self.title}"


class StudyPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=140, default="Smart Study Plan")
    start_date = models.DateField()
    end_date = models.DateField(db_index=True)
    daily_hours = models.DecimalField(max_digits=4, decimal_places=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "end_date"]),
        ]

    def __str__(self):
        return self.title


class StudySession(models.Model):
    TASK_CHOICES = [
        ("study", "Study"),
        ("revision", "Revision"),
        ("quiz", "Quiz"),
        ("break", "Break"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(StudyPlan, related_name="sessions", on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    weak_topic = models.ForeignKey(WeakTopic, null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    task_type = models.CharField(max_length=20, choices=TASK_CHOICES, default="study")
    title = models.CharField(max_length=180)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["date", "start_time"]
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["plan", "date", "start_time"]),
            models.Index(fields=["subject", "is_completed"]),
        ]

    def __str__(self):
        return self.title


class ProgressLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    weak_topic = models.ForeignKey(WeakTopic, null=True, blank=True, on_delete=models.SET_NULL)
    studied_minutes = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    quiz_score = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-logged_at"]
        indexes = [
            models.Index(fields=["user", "-logged_at"]),
            models.Index(fields=["subject", "completed"]),
        ]


class QuizQuestion(models.Model):
    QUIZ_TYPES = [
        ("mcq", "MCQ"), 
        ("true_false", "True/False"), 
        ("short", "Short Answer"),
        ("fill_blank", "Fill in the Blanks"),
        ("rapid", "Rapid Revision")
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    weak_topic = models.ForeignKey(WeakTopic, null=True, blank=True, on_delete=models.SET_NULL)
    question_type = models.CharField(max_length=20, choices=QUIZ_TYPES, default="mcq")
    question = models.TextField()
    options = models.JSONField(default=list, blank=True)
    answer = models.TextField()
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, default="medium")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class AIRecommendation(models.Model):
    PRIORITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    recommendation = models.TextField()
    study_focus = models.CharField(max_length=180)
    revision_focus = models.CharField(max_length=180, blank=True)
    estimated_minutes = models.PositiveIntegerField(default=60)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    confidence = models.PositiveSmallIntegerField(default=70)
    study_order = models.JSONField(default=list, blank=True)
    source_date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-source_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "source_date"]),
            models.Index(fields=["user", "priority"]),
        ]


class QuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    weak_topic = models.ForeignKey(WeakTopic, null=True, blank=True, on_delete=models.SET_NULL)
    difficulty = models.CharField(max_length=20, default="medium")
    question_count = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    score_percent = models.PositiveSmallIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    weak_topics = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["subject", "difficulty"]),
        ]


class BurnoutSnapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    risk = models.PositiveSmallIntegerField(default=0)
    wellness_score = models.PositiveSmallIntegerField(default=100)
    stress_indicators = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]


class UserLearningProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    learning_style = models.CharField(max_length=80, default="structured active recall")
    preferred_study_time = models.CharField(max_length=80, blank=True)
    favorite_subjects = models.JSONField(default=list, blank=True)
    long_term_goals = models.TextField(blank=True)
    response_depth = models.CharField(max_length=20, default="balanced")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user}: learning profile"


class MentorConversation(models.Model):
    MODE_CHOICES = [
        ("exam", "Exam Mentor"),
        ("revision", "Revision Mentor"),
        ("coding", "Coding Mentor"),
        ("productivity", "Productivity Coach"),
        ("quick", "Quick Doubt Solver"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=160, default="Mentor conversation")
    mode = models.CharField(max_length=24, choices=MODE_CHOICES, default="exam")
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-updated_at"]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
            models.Index(fields=["user", "is_pinned"]),
        ]


class MentorMessage(models.Model):
    ROLE_CHOICES = [("user", "User"), ("assistant", "Assistant")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    conversation = models.ForeignKey(MentorConversation, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    mode = models.CharField(max_length=24, default="exam")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
        ]


class AIMemory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=80)
    value = models.TextField()
    confidence = models.PositiveSmallIntegerField(default=70)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "key")
        ordering = ["key"]


class StudyInsight(models.Model):
    SEVERITY_CHOICES = [("info", "Info"), ("warning", "Warning"), ("success", "Success")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    detail = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    source = models.CharField(max_length=80, default="mentor")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]


class MentorRecommendation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    action = models.TextField()
    priority = models.CharField(max_length=20, default="medium")
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "priority"]),
        ]


class CareerRoadmap(models.Model):
    LEVEL_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_career = models.CharField(max_length=140)
    skill_level = models.CharField(max_length=24, choices=LEVEL_CHOICES, default="beginner")
    weekly_hours = models.PositiveSmallIntegerField(default=8)
    timeline_weeks = models.PositiveSmallIntegerField(default=12)
    preferred_technologies = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)
    revision_strategy = models.TextField(blank=True)
    interview_path = models.TextField(blank=True)
    adaptive_notes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
            models.Index(fields=["user", "target_career"]),
        ]

    def __str__(self):
        return f"{self.target_career} roadmap"


class CareerRoadmapPhase(models.Model):
    PHASE_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("projects", "Project Building"),
        ("interview", "Interview Preparation"),
    ]

    roadmap = models.ForeignKey(CareerRoadmap, related_name="phases", on_delete=models.CASCADE)
    phase_type = models.CharField(max_length=24, choices=PHASE_CHOICES)
    title = models.CharField(max_length=160)
    order = models.PositiveSmallIntegerField(default=1)
    estimated_weeks = models.PositiveSmallIntegerField(default=2)
    topics = models.JSONField(default=list, blank=True)
    learning_goals = models.JSONField(default=list, blank=True)
    recommended_projects = models.JSONField(default=list, blank=True)
    progress_percent = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["roadmap", "order"]),
        ]


class SkillProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roadmap = models.ForeignKey(CareerRoadmap, null=True, blank=True, related_name="skills", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80, default="technical")
    current_level = models.PositiveSmallIntegerField(default=30)
    target_level = models.PositiveSmallIntegerField(default=80)
    confidence = models.PositiveSmallIntegerField(default=50)
    evidence = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]
        unique_together = ("user", "roadmap", "name")
        indexes = [
            models.Index(fields=["user", "category"]),
        ]


class CareerProjectRecommendation(models.Model):
    STATUS_CHOICES = [
        ("recommended", "Recommended"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roadmap = models.ForeignKey(CareerRoadmap, null=True, blank=True, related_name="project_recommendations", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    difficulty = models.CharField(max_length=24, default="medium")
    estimated_weeks = models.PositiveSmallIntegerField(default=2)
    required_technologies = models.JSONField(default=list, blank=True)
    architecture_suggestions = models.JSONField(default=list, blank=True)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="recommended")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["status", "difficulty", "title"]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]


class CareerReadinessSnapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roadmap = models.ForeignKey(CareerRoadmap, null=True, blank=True, related_name="readiness_snapshots", on_delete=models.CASCADE)
    career_readiness = models.PositiveSmallIntegerField(default=0)
    interview_readiness = models.PositiveSmallIntegerField(default=0)
    portfolio_strength = models.PositiveSmallIntegerField(default=0)
    technical_confidence = models.PositiveSmallIntegerField(default=0)
    missing_requirements = models.JSONField(default=list, blank=True)
    improvement_trends = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]


class CareerLearningInsight(models.Model):
    SEVERITY_CHOICES = [("info", "Info"), ("warning", "Warning"), ("success", "Success")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roadmap = models.ForeignKey(CareerRoadmap, null=True, blank=True, related_name="learning_insights", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    detail = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]


class CareerInterviewSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roadmap = models.ForeignKey(CareerRoadmap, null=True, blank=True, related_name="interview_sessions", on_delete=models.CASCADE)
    interview_type = models.CharField(max_length=40, default="technical")
    question = models.TextField()
    answer = models.TextField(blank=True)
    evaluation = models.TextField(blank=True)
    score = models.PositiveSmallIntegerField(default=0)
    weak_concepts = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=140)
    message = models.TextField()
    scheduled_for = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["is_read", "scheduled_for"]
        indexes = [
            models.Index(fields=["user", "is_read", "scheduled_for"]),
        ]


class PomodoroSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    focus_minutes = models.PositiveIntegerField(default=25)
    break_minutes = models.PositiveIntegerField(default=5)
    completed_cycles = models.PositiveIntegerField(default=1)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]


class StudyGroup(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="owned_study_groups", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through="StudyGroupMembership", related_name="study_groups")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class StudyGroupMembership(models.Model):
    ROLE_CHOICES = [("owner", "Owner"), ("member", "Member")]

    group = models.ForeignKey(StudyGroup, related_name="memberships", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("group", "user")
        ordering = ["joined_at"]


class FocusSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    planned_minutes = models.PositiveIntegerField(default=25)
    focused_minutes = models.PositiveIntegerField(default=0)
    interruptions = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
