from django.contrib import admin

from .models import (
    AIRecommendation,
    AIMemory,
    BurnoutSnapshot,
    MentorConversation,
    MentorMessage,
    MentorRecommendation,
    Notification,
    PomodoroSession,
    ProgressLog,
    QuizAttempt,
    QuizQuestion,
    StudyInsight,
    StudyPlan,
    StudySession,
    Subject,
    WeakTopic,
)

admin.site.register(Subject)
admin.site.register(WeakTopic)
admin.site.register(StudyPlan)
admin.site.register(StudySession)
admin.site.register(ProgressLog)
admin.site.register(QuizQuestion)
admin.site.register(QuizAttempt)
admin.site.register(AIRecommendation)
admin.site.register(BurnoutSnapshot)
admin.site.register(MentorConversation)
admin.site.register(MentorMessage)
admin.site.register(AIMemory)
admin.site.register(StudyInsight)
admin.site.register(MentorRecommendation)
admin.site.register(Notification)
admin.site.register(PomodoroSession)
