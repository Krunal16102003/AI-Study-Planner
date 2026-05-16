from datetime import datetime, time, timedelta
from decimal import Decimal
import json
import os
import random
import urllib.request
from urllib.parse import quote_plus

from django.db.models import Avg, Count, Sum
from django.utils import timezone

from accounts.models import Profile
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
    StudyInsight,
    StudyPlan,
    StudySession,
    Subject,
    SkillProfile,
    WeakTopic,
)


DIFFICULTY_WEIGHT = {"low": 1, "medium": 2, "high": 3}
PRIORITY_WEIGHT = {"low": 1, "medium": 2, "high": 3}
UNDERSTANDING_WEIGHT = {"strong": 1, "medium": 2, "weak": 3}

TRUSTED_LEARNING_CHANNELS = {
    "biology": ["Khan Academy", "Unacademy", "NPTEL"],
    "physics": ["Physics Wallah", "Khan Academy", "NPTEL", "Unacademy"],
    "chemistry": ["Physics Wallah", "Khan Academy", "NPTEL"],
    "mathematics": ["Khan Academy", "NPTEL", "Unacademy"],
    "math": ["Khan Academy", "NPTEL", "Unacademy"],
    "computer science": ["freeCodeCamp", "GeeksforGeeks", "NPTEL"],
    "reactjs": ["freeCodeCamp", "GeeksforGeeks"],
    "react": ["freeCodeCamp", "GeeksforGeeks"],
}


def infer_exam_type(subject_name):
    name = subject_name.lower()
    if any(token in name for token in ["physics", "chemistry", "math"]):
        return "JEE"
    if "biology" in name:
        return "NEET"
    if any(token in name for token in ["react", "computer", "javascript", "python", "data structures"]):
        return "beginner tutorial"
    return "exam revision"


def trusted_channel_for(subject_name, index=0):
    key = subject_name.lower()
    channels = next((value for token, value in TRUSTED_LEARNING_CHANNELS.items() if token in key), None)
    channels = channels or ["Khan Academy", "freeCodeCamp", "NPTEL"]
    return channels[index % len(channels)]


def build_youtube_resource(subject, topic, difficulty, index=0):
    exam_type = infer_exam_type(subject)
    channel = trusted_channel_for(subject, index)
    intent = {
        "low": "beginner concept lecture",
        "medium": "revision lecture",
        "high": "advanced numericals problem solving",
        "hard": "advanced numericals problem solving",
        "easy": "beginner concept lecture",
    }.get(difficulty, "revision lecture")
    query = f"{subject} {topic} {exam_type} {intent} {channel}"
    encoded = quote_plus(query)
    return {
        "title": f"{subject}: {topic} {intent.title()}",
        "url": f"https://www.youtube.com/results?search_query={encoded}",
        "thumbnail": "",
        "platform": "YouTube",
        "channel": channel,
        "search_query": query,
        "duration": "Curated search",
    }


def subject_score(subject):
    days = max((subject.exam_date - timezone.localdate()).days, 1)
    weak_score = sum(
        UNDERSTANDING_WEIGHT.get(topic.understanding_level, 2)
        for topic in subject.weak_topics.filter(is_completed=False)
    )
    urgency = 20 / days
    # Calculate the gap between current confidence and target
    goal_gap = max(0, subject.target_score - subject.confidence) / 10
    
    return (
        urgency
        + DIFFICULTY_WEIGHT.get(subject.difficulty, 2) * 2
        + PRIORITY_WEIGHT.get(subject.priority, 2) * 2
        + weak_score
        + goal_gap
    )


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, round(value)))


def format_topic_list(topics, fallback="core concepts"):
    topics = [topic for topic in topics if topic]
    if not topics:
        return fallback
    if len(topics) == 1:
        return topics[0]
    return ", ".join(topics[:-1]) + f", and {topics[-1]}"


def build_ai_insight_sentence(subject, readiness, weakness=None):
    weak_topics = format_topic_list((weakness or {}).get("weak_topics", []), "foundation topics")
    reasons = format_topic_list((weakness or {}).get("reasons", []), "mixed practice gaps")
    if readiness["readiness"] < 45:
        return (
            f"{subject.name} is currently at risk: readiness is {readiness['readiness']}% with "
            f"{readiness['completion']}% topic completion. Prioritize {weak_topics}, then do a 10-question error-review quiz."
        )
    if readiness["quiz_average"] and readiness["quiz_average"] < 65:
        return (
            f"{subject.name} quiz accuracy is holding readiness back. Review {weak_topics}, write down the mistake pattern, "
            f"and retry questions after one focused revision block."
        )
    if weakness and weakness.get("risk", 0) > 50:
        return (
            f"{subject.name} needs attention because of {reasons}. Start with {weak_topics} before adding new material."
        )
    return (
        f"{subject.name} is progressing steadily. Keep one revision block, one active recall drill, "
        f"and one mixed quiz in the next study cycle."
    )


def subject_readiness(subject):
    logs = ProgressLog.objects.filter(user=subject.user, subject=subject)
    topics = WeakTopic.objects.filter(user=subject.user, subject=subject)
    total_topics = topics.count()
    completed_topics = topics.filter(is_completed=True).count()
    completion = (completed_topics / total_topics) * 100 if total_topics else subject.confidence
    quiz_average = logs.exclude(quiz_score=None).aggregate(avg=Avg("quiz_score"))["avg"]
    quiz_component = quiz_average if quiz_average is not None else subject.confidence
    studied_days = logs.extra({"day": "date(logged_at)"}).values("day").distinct().count()
    studied_minutes = logs.aggregate(total=Sum("studied_minutes"))["total"] or 0
    revision_count = logs.filter(completed=True).count()
    weak_penalty = topics.filter(understanding_level="weak", is_completed=False).count() * 8
    exam_urgency_penalty = 10 if (subject.exam_date - timezone.localdate()).days <= 7 and completion < 70 else 0
    consistency = min(studied_days * 14, 100)
    revision_frequency = min(revision_count * 12, 100)
    study_volume = min(studied_minutes / 6, 100)

    score = (
        quiz_component * 0.30
        + completion * 0.30
        + revision_frequency * 0.15
        + consistency * 0.15
        + study_volume * 0.10
        - weak_penalty
        - exam_urgency_penalty
    )

    if score >= 80:
        status = "Exam ready"
    elif score >= 60:
        status = "Almost ready"
    elif score >= 40:
        status = "Needs revision"
    else:
        status = "At risk"

    return {
        "subject_id": subject.id,
        "subject": subject.name,
        "readiness": clamp(score),
        "status": status,
        "quiz_average": round(quiz_average or 0, 1),
        "target_score": subject.target_score,
        "completion": round(completion),
        "revision_frequency": revision_count,
        "study_consistency_days": studied_days,
        "weak_topics": topics.filter(understanding_level="weak", is_completed=False).count(),
    }


def weakness_analysis(user):
    subjects = Subject.objects.filter(user=user).prefetch_related("weak_topics")
    analysis = []

    for subject in subjects:
        readiness = subject_readiness(subject)
        logs = ProgressLog.objects.filter(user=user, subject=subject)
        weak_topics_queryset = subject.weak_topics.filter(is_completed=False).order_by("understanding_level", "title")[:4]
        weak_topics = list(weak_topics_queryset)

        missed_sessions_count = StudySession.objects.filter(
            user=user,
            subject=subject,
            date__lt=timezone.localdate(),
            is_completed=False,
        ).count()
        risk = clamp(100 - readiness["readiness"] + missed_sessions_count * 5)
        reasons = []
        if readiness["quiz_average"] < 60:
            reasons.append("low quiz scores")
        if readiness["completion"] < 60:
            reasons.append("low topic completion")
        if readiness["study_consistency_days"] < 3:
            reasons.append("irregular study pattern")
        if weak_topics_queryset.exists():
            reasons.append("unfinished weak topics")
        if missed_sessions_count > 0:
            reasons.append("missed scheduled tasks")

        analysis.append(
            {
                "subject_id": subject.id,
                "subject": subject.name,
                "risk": risk,
                "weak_topics": [topic.title for topic in weak_topics],
                "reasons": reasons or ["no major weakness detected"],
                "study_minutes": logs.aggregate(total=Sum("studied_minutes")).get("total", 0) or 0,
                "missed_tasks": missed_sessions_count,
            }
        )

    return sorted(analysis, key=lambda item: item["risk"], reverse=True)


def revision_interval_days(topic, subject, performance_score=None): # Guard performance_score
    performance_score = performance_score if performance_score is not None else subject.confidence
    if topic.understanding_level == "weak" or performance_score < 50:
        return [1, 3, 7]
    if topic.understanding_level == "medium" or performance_score < 75:
        return [2, 5, 10]
    return [4, 9, 16]


def revision_recommendations(user, horizon_days=14):
    today = timezone.localdate()
    recommendations = []
    topics = WeakTopic.objects.filter(user=user, is_completed=False).select_related("subject") # Can be empty

    for topic in topics:
        logs = ProgressLog.objects.filter(user=user, subject=topic.subject, weak_topic=topic)
        performance = logs.exclude(quiz_score=None).aggregate(avg=Avg("quiz_score"))["avg"]
        intervals = revision_interval_days(topic, topic.subject, performance) # Ensure performance is guarded
        for interval in intervals:
            revision_date = today + timedelta(days=interval)
            if revision_date <= today + timedelta(days=horizon_days):
                recommendations.append(
                    {
                        "subject": topic.subject.name,
                        "topic": topic.title,
                        "date": revision_date.isoformat(),
                        "reason": f"{topic.understanding_level.title()} topic spaced after {interval} day(s)",
                    }
                )

    return sorted(recommendations, key=lambda item: item["date"])[:12]


def productivity_analytics(user):
    subjects = Subject.objects.filter(user=user).prefetch_related("weak_topics")
    progress = ProgressLog.objects.filter(user=user).select_related("subject") # Can be empty
    pomodoros = PomodoroSession.objects.filter(user=user) # Can be empty
    sessions = StudySession.objects.filter(user=user)
    day_rows = list(
        progress.extra({"day": "date(logged_at)"})
        .values("day")
        .annotate(minutes=Sum("studied_minutes"), completed=Count("id"))
        .order_by("-day")[:14]
    )[::-1] # Ensure this handles empty progress gracefully
    studied_days = {str(row["day"]) for row in day_rows if row["minutes"]} # This is a set, not a count
    today = timezone.localdate()
    streak = 0
    cursor = today
    while cursor.isoformat() in studied_days:
        streak += 1
        cursor -= timedelta(days=1)

    subject_performance = []
    for subject in subjects:
        readiness = subject_readiness(subject)
        subject_performance.append(
            {
                "subject": subject.name,
                "readiness": readiness["readiness"],
                "completion": readiness["completion"],
                "quiz_average": readiness["quiz_average"],
                "study_minutes": progress.filter(subject=subject).aggregate(total=Sum("studied_minutes"))["total"] or 0,
            }
        )

    total_sessions = sessions.count() # Can be 0
    completed_sessions = sessions.filter(is_completed=True).count() # Can be 0
    study_minutes = progress.aggregate(total=Sum("studied_minutes")).get("total", 0) or 0
    focus_minutes = pomodoros.aggregate(total=Sum("focus_minutes")).get("total", 0) or 0
    quiz_scores = list(progress.exclude(quiz_score=None).order_by("logged_at").values_list("quiz_score", flat=True))
    recent_quiz = quiz_scores[-5:]
    earlier_quiz = quiz_scores[:-5]
    quiz_delta = (
        round((sum(recent_quiz) / len(recent_quiz)) - (sum(earlier_quiz) / len(earlier_quiz)), 1)
        if recent_quiz and earlier_quiz
        else 0
    )
    average_daily_minutes = round(study_minutes / max(len(studied_days), 1)) if studied_days else 0
    completion_rate = clamp((completed_sessions / total_sessions) * 100 if total_sessions else 0)
    learning_efficiency = clamp((completion_rate * 0.45) + ((sum(recent_quiz) / len(recent_quiz)) if recent_quiz else 0) * 0.35 + min(focus_minutes / 6, 100) * 0.20)
    weakest_subject = min(subject_performance, key=lambda item: item["readiness"], default=None)
    strongest_subject = max(subject_performance, key=lambda item: item["readiness"], default=None)
    ai_insights = []
    if weakest_subject:
        ai_insights.append(
            f"{weakest_subject['subject']} is your biggest leverage area at {weakest_subject['readiness']}% readiness. Review weak topics before attempting advanced questions."
        )
    if strongest_subject and strongest_subject != weakest_subject:
        ai_insights.append(
            f"{strongest_subject['subject']} is your strongest subject. Use it for confidence-building mixed practice, not long passive revision."
        )
    if quiz_delta > 0:
        ai_insights.append(f"Quiz accuracy improved by {quiz_delta}% compared with your earlier attempts. Keep the revision-before-quiz sequence.")
    elif quiz_delta < 0:
        ai_insights.append(f"Recent quiz accuracy dropped by {abs(quiz_delta)}%. Slow down and do error review before the next quiz.")
    if average_daily_minutes:
        ai_insights.append(f"Your active study days average {average_daily_minutes} minutes. Protect that rhythm before increasing workload.")

    return {
        "success": True,
        "study_patterns": [
            {"day": str(row["day"]), "minutes": row["minutes"] or 0, "completed_logs": row["completed"]}
            for row in day_rows
        ] if day_rows else [], # Return empty list if no patterns
        "completion_rate": completion_rate, # Guard division
        "focus_sessions": pomodoros.count(),
        "focus_minutes": focus_minutes,
        "consistency_streak": streak,
        "subject_performance": sorted(subject_performance, key=lambda item: item["readiness"], reverse=True),
        "learning_efficiency": learning_efficiency,
        "quiz_accuracy_delta": quiz_delta,
        "average_daily_minutes": average_daily_minutes,
        "burnout_snapshot": burnout_detection(user),
        "ai_insights": ai_insights[:4],
    }


def adaptive_pomodoro_settings(user):
    recent = PomodoroSession.objects.filter(user=user).order_by("-started_at")[:10]
    focus_minutes = [session.focus_minutes for session in recent] # Can be empty
    avg_focus = sum(focus_minutes) / len(focus_minutes) if focus_minutes else 25
    completed_cycles = sum(session.completed_cycles for session in recent)
    completion_signal = completed_cycles / max(len(focus_minutes), 1)

    if completion_signal >= 2 and avg_focus >= 25:
        focus = min(round(avg_focus + 5), 50)
        break_minutes = 10
        reason = "You are completing focus cycles consistently, so the next session is slightly longer."
    elif completion_signal < 1:
        focus = 20
        break_minutes = 5
        reason = "Recent consistency is low, so the next session is shorter and easier to finish."
    else:
        focus = round(avg_focus)
        break_minutes = 5
        reason = "Your current rhythm looks balanced."

    return {"focus_minutes": focus, "break_minutes": break_minutes, "reason": reason}


def _generate_simulated_external_resources(query_params, count=5):
    """
    Simulates fetching external educational resources based on query parameters.
    This function replaces actual API calls to YouTube, Coursera, etc.
    """
    subject = query_params.get("subject", "General")
    topic = query_params.get("topic", "Concepts")
    difficulty = query_params.get("difficulty", "medium")
    resource_type_pref = query_params.get("type_pref", "video")
    ai_badge = query_params.get("ai_badge", "Recommended")

    platforms = {
        "video": [("YouTube", "https://www.youtube.com/results?search_query=")],
        "course": [("Coursera", "https://www.coursera.org/search?query="), ("edX", "https://www.edx.org/search?q="), ("NPTEL", "https://nptel.ac.in/courses?search=")],
        "article": [("GeeksforGeeks", "https://www.geeksforgeeks.org/?s="), ("freeCodeCamp", "https://www.freecodecamp.org/news/search/?query="), ("Khan Academy", "https://www.khanacademy.org/search?page_search_query=")],
        "practice": [("GeeksforGeeks Practice", "https://www.geeksforgeeks.org/?s="), ("HackerRank", "https://www.hackerrank.com/search?query=")]
    }

    resource_pool = []
    for r_type, p_list in platforms.items():
        for p_name, p_base_url in p_list:
            resource_pool.append({
                "platform": p_name,
                "base_url": p_base_url,
                "type": r_type
            })

    generated_resources = []
    for i in range(count):
        # Cycle through resource types and platforms for variety
        resource_info = resource_pool[i % len(resource_pool)]
        platform = resource_info["platform"]
        base_url = resource_info["base_url"]
        r_type = resource_info["type"]

        title_prefix = {
            "video": "Lecture", "course": "Course", "article": "Guide", "practice": "Problems"
        }.get(r_type, "Resource")

        # Generate a more specific title
        encoded_query = quote_plus(f"{subject} {topic} {infer_exam_type(subject)} {difficulty} {title_prefix}")

        if r_type == "video" and platform == "YouTube":
            video = build_youtube_resource(subject, topic, difficulty, i)
            title = video["title"]
            url = video["url"]
            thumbnail = video["thumbnail"]
            duration = video["duration"]
            channel = video["channel"]
        elif r_type == "course":
            title = f"{subject} {topic} - {platform} Course"
            url = f"{base_url}{encoded_query}"
            thumbnail = ""
            duration = f"{4 + i*2} hours"
            channel = platform
        elif r_type == "article":
            title = f"{subject} {topic} {title_prefix} on {platform}"
            url = f"{base_url}{encoded_query}"
            thumbnail = ""
            duration = "15 min read"
            channel = platform
        elif r_type == "practice":
            title = f"{subject} {topic} {title_prefix} on {platform}"
            url = f"{base_url}{encoded_query}"
            thumbnail = ""
            duration = "30 min session"
            channel = platform
        else:
            title = f"{subject} {topic} {title_prefix}"
            url = f"https://example.com/{subject.lower().replace(' ', '-')}/{topic.lower().replace(' ', '-')}"
            thumbnail = ""
            duration = "N/A"
            channel = platform

        generated_resources.append({
            "id": f"{subject}-{topic}-{platform}-{i}",
            "title": title,
            "description": f"A {difficulty}-level {r_type} covering {topic} for {subject}.",
            "url": url,
            "platform": platform,
            "type": r_type,
            "duration": duration,
            "difficulty_level": difficulty,
            "thumbnail": thumbnail,
            "ai_badge": ai_badge,
            "channel": channel,
            "search_query": f"{subject} {topic} {infer_exam_type(subject)} {difficulty}",
            "subject_name": subject, # For filtering
            "subject_id": query_params.get("subject_id"), # For filtering
            "is_completed": False # Assume newly recommended are not completed
        })
    return generated_resources


def resource_recommendations(user, subject_id=None):
    all_recommended_resources = []
    today = timezone.localdate()
    
    # Determine context: general or specific subject
    analysis = weakness_analysis(user)
    subjects = Subject.objects.filter(user=user)
    if subject_id:
        subjects = subjects.filter(id=subject_id)
        analysis = [item for item in analysis if item["subject_id"] == int(subject_id)]

    if not subjects.exists():
        return _generate_simulated_external_resources(
            {
                "subject": "Study Skills",
                "topic": "Getting Started",
                "difficulty": "medium",
                "ai_badge": "Starter Pack",
                "type_pref": "video",
            },
            count=6,
        )

    # 1. Recommendations based on Weak Topics / High Risk Subjects
    for weakness in analysis[:3]: # Focus on top 3 weak areas
        subject = weakness["subject"]
        subj_obj = Subject.objects.filter(user=user, id=weakness["subject_id"]).first()
        if not subj_obj:
            continue
        days_left = (subj_obj.exam_date - today).days
        is_critical = days_left <= 7 or subj_obj.priority == "high"
        
        topics = weakness["weak_topics"] or ["Core Concepts"]
        
        # AI Recommendation Logic based on priority/urgency
        query_params = {
            "subject": subject,
            "subject_id": subj_obj.id,
            "difficulty": subj_obj.difficulty,
            "ai_badge": "Weak Topic Focus" if weakness["risk"] > 50 else "High Priority"
        }

        if days_left <= 3:
            query_params["ai_badge"] = "Near Exam: Rapid Revision"
            query_params["type_pref"] = "article" # Prefer quick reads/summaries
            query_params["difficulty"] = "medium" # Focus on core concepts
        elif is_critical:
            query_params["ai_badge"] = "High Priority: Intensive Study"
            query_params["type_pref"] = "course" # Suggest deeper dives
            query_params["difficulty"] = "hard"
        else:
            query_params["ai_badge"] = "Standard: Concept Building"
            query_params["type_pref"] = "video" # General learning
            query_params["difficulty"] = "easy" if subj_obj.confidence < 60 else "medium"

        for topic_title in topics[:2]: # Get 2 resources per weak topic
            query_params["topic"] = topic_title
            all_recommended_resources.extend(_generate_simulated_external_resources(query_params, count=1))

    # 2. General Recommendations for other subjects (trending, balanced)
    for subj_obj in subjects.exclude(id__in=[w["subject_id"] for w in analysis])[:2]: # Top 2 non-weak subjects
        query_params = {
            "subject": subj_obj.name,
            "subject_id": subj_obj.id,
            "difficulty": subj_obj.difficulty,
            "topic": "Overview",
            "ai_badge": "Trending" if subj_obj.priority == "high" else "Balanced Study"
        }
        all_recommended_resources.extend(_generate_simulated_external_resources(query_params, count=1))

    # 3. User-defined Weak Topics with resource_url (existing functionality)
    user_defined_weak_topics = WeakTopic.objects.filter(user=user, resource_url__isnull=False, is_completed=False).select_related("subject")
    for wt in user_defined_weak_topics[:5]: # Limit to 5
        all_recommended_resources.append({
            "id": f"user-defined-{wt.id}",
            "title": wt.title,
            "description": wt.notes or f"User-defined weak topic for {wt.subject.name}.",
            "url": wt.resource_url,
            "platform": "User Notes",
            "type": "notes",
            "duration": "N/A",
            "difficulty_level": wt.understanding_level,
            "thumbnail": "https://via.placeholder.com/150/CCCCCC/000000?text=Notes",
            "ai_badge": "Your Custom Resource",
            "subject_name": wt.subject.name,
            "subject_id": wt.subject.id,
            "is_completed": wt.is_completed
        })

    # Shuffle and return a limited number of unique recommendations
    # Use a set to ensure uniqueness based on a simple identifier
    unique_resources = {}
    for res in all_recommended_resources:
        unique_resources[res["id"]] = res

    return list(unique_resources.values())[:15] # Limit total recommendations


def get_resource_stats(user):
    """Calculates summary statistics for the Resources dashboard"""
    # Now includes dynamically generated resources in the count
    all_resources = resource_recommendations(user) # Get all potential resources
    total = len(all_resources)
    completed = sum(1 for r in all_resources if r.get("is_completed", False)) # Check if resource has is_completed flag
    weak_topics_count = WeakTopic.objects.filter(user=user, is_completed=False, understanding_level="weak").count()
    
    return {
        "total_materials": total,
        "completed": completed,
        "in_progress": total - completed, # Corrected key name
        "recommended": total, # Total resources are recommended
        "weak_topics": weak_topics_count # Corrected key name
    }


def get_performance_metrics(user):
    """Calculates mastery and improvement trends for the Quiz Dashboard"""
    subjects = Subject.objects.filter(user=user)
    metrics = []
    
    for subj in subjects:
        logs = ProgressLog.objects.filter(user=user, subject=subj).exclude(quiz_score=None).order_by("logged_at")
        avg_score = logs.aggregate(Avg("quiz_score"))["quiz_score__avg"] or 0
        
        # Calculate 'Mastery' as a weighted mix of confidence, completion, and quiz scores
        readiness = subject_readiness(subj)
        mastery = clamp((avg_score * 0.5) + (readiness["completion"] * 0.5))
        
        metrics.append({
            "subject": subj.name,
            "mastery": mastery,
            "avg_quiz": round(avg_score, 1),
            "attempts": logs.count(),
            "status": readiness["status"]
        })
    return metrics


def calculate_user_stats(user):
    """Calculates Gamification stats (XP and Level)"""
    logs = ProgressLog.objects.filter(user=user)
    completed_topics = WeakTopic.objects.filter(user=user, is_completed=True).count()
    
    total_minutes = logs.aggregate(total=Sum("studied_minutes"))["total"] or 0
    avg_quiz = logs.exclude(quiz_score=None).aggregate(avg=Avg("quiz_score"))["avg"] or 0
    
    # XP Logic: 1 XP per minute + 100 XP per completed topic + Quiz performance bonus
    total_xp = (total_minutes) + (completed_topics * 100) + (int(avg_quiz) * 5)
    level = (total_xp // 1000) + 1
    xp_to_next = 1000 - (total_xp % 1000)
    
    return {"xp": total_xp, "level": level, "xp_progress": 100 - (xp_to_next / 10)}


def chatbot_reply(user, message):
    text = message.lower()
    weak = weakness_analysis(user) # Can be empty
    revisions = revision_recommendations(user, horizon_days=7) # Can be empty
    resources = resource_recommendations(user) # Can be empty
    subjects = Subject.objects.filter(user=user).order_by("exam_date") # Can be empty
    analytics = productivity_analytics(user)
    burnout = analytics.get("burnout_snapshot") or burnout_detection(user)
    next_subject = subjects.first()
    top_weakness = weak[0] if weak else None
    subject_lookup = {subject.id: subject for subject in subjects}
    top_subject = subject_lookup.get(top_weakness["subject_id"]) if top_weakness else next_subject

    if "quiz" in text:
        subject = top_subject
        if not subject:
            return "Add a subject first, then I can generate a personalized quiz."
        readiness = subject_readiness(subject)
        weak_topics = format_topic_list(top_weakness.get("weak_topics", []) if top_weakness else [], subject.name)
        return (
            f"### Quiz Strategy\n"
            f"Try a **{subject.difficulty}** quiz for **{subject.name}**, focused on **{weak_topics}**.\n\n"
            f"Your current readiness is **{readiness['readiness']}%** and quiz average is **{readiness['quiz_average']}%**. "
            f"After each question, write one line explaining why the wrong options fail. That error review matters more than the score."
        )
    if "explain" in text or "concept" in text:
        focus = weak[0]["weak_topics"][0] if weak and weak[0]["weak_topics"] else "your weakest topic" # Guard access
        subject_name = top_weakness["subject"] if top_weakness else (next_subject.name if next_subject else "this subject")
        return (
            f"### Concept Coach: {focus}\n"
            f"Treat **{focus}** in **{subject_name}** as a three-layer skill:\n\n"
            f"1. **Definition layer**: write the rule, formula, or process in one sentence.\n"
            f"2. **Recognition layer**: list the clues that tell you this concept is being tested.\n"
            f"3. **Application layer**: solve one easy example, then one mixed example without notes.\n\n"
            f"Finish by writing your mistake pattern. That converts confusion into a revision target."
        )
    if "recommend" in text or "resource" in text or "material" in text:
        if resources:
            first = resources[0]
            return (
                f"### Resource Recommendation\n"
                f"Start with **{first['title']}**.\n\n"
                f"Why this fits: {first['description']} Use it for one focused block, then immediately attempt 5 recall questions so it becomes active learning."
            )
        return "Add weak topics and study logs so I can suggest better resources."
    if "plan" in text or "today" in text:
        if revisions:
            first = revisions[0] # Guard access
            return (
                f"### Today's Priority\n"
                f"* **Subject**: {first['subject']}\n"
                f"* **Topic**: {first['topic']}\n"
                f"* **Why now**: {first['reason']}.\n"
                f"* **Session shape**: 10 min recall, 30 min focused revision, 10 min quiz/error review."
            )
        if subjects:
            subject = subjects.first()
            readiness = subject_readiness(subject)
            return (
                f"Start with **{subject.name}** today because its exam is closest. "
                f"Readiness is **{readiness['readiness']}%**, so begin with active recall before opening notes."
            )
        return "Add your first subject with exam date, difficulty, and priority, then I can build a daily plan."

    if weak:
        top = weak[0]
        subject = subject_lookup.get(top["subject_id"])
        readiness = subject_readiness(subject) if subject else {"readiness": 0, "completion": 0, "quiz_average": 0}
        return (
            f"### AI Analysis\n"
            f"Your highest-risk area is **{top['subject']}** with **{top['risk']}% risk** and **{readiness['readiness']}% readiness**.\n\n"
            f"Focus first on **{format_topic_list(top['weak_topics'])}** because the main drivers are {format_topic_list(top['reasons'])}. "
            f"Do one revision block, then a short quiz, then log the mistakes."
        )
    if "burnout" in text or "tired" in text or "break" in text:
        return (
            f"### Wellness Check\n"
            f"Burnout risk is **{burnout['risk']}%** with **{burnout['study_minutes_7d']} study minutes** over the last week.\n\n"
            f"**Recommendation**: {burnout['recommendation']}"
        )
    if "focus" in text:
        focus = focus_mode_summary(user)
        return f"### Focus Analytics\nYour current focus score is **{focus['focus_score']}%**. \n\n{focus['recommendation']}"
    if analytics.get("ai_insights"):
        return "### Smart Study Brief\n" + "\n".join(f"* {item}" for item in analytics["ai_insights"])
    return "I can help with study plans, concept explanations, quizzes, resources, focus mode, burnout, and daily recommendations. Add subjects and weak topics to personalize my advice."


MENTOR_MODE_CONFIG = {
    "exam": {"label": "Exam Mentor", "style": "exam-focused strategy, readiness, and scoring tradeoffs"},
    "revision": {"label": "Revision Mentor", "style": "spaced repetition, active recall, and weak-topic recovery"},
    "coding": {"label": "Coding Mentor", "style": "step-by-step reasoning, examples, edge cases, and debugging"},
    "productivity": {"label": "Productivity Coach", "style": "focus rhythm, burnout control, routines, and sustainable workload"},
    "quick": {"label": "Quick Doubt Solver", "style": "concise explanation, direct answer, and one practice prompt"},
}


def mentor_context(user):
    today = timezone.localdate()
    subjects = list(Subject.objects.filter(user=user).prefetch_related("weak_topics").order_by("exam_date"))
    analytics = productivity_analytics(user)
    focus = focus_mode_summary(user)
    burnout = burnout_detection(user)
    attempts = list(QuizAttempt.objects.filter(user=user).select_related("subject", "weak_topic")[:6])
    memories = {item.key: item.value for item in AIMemory.objects.filter(user=user)}
    daily = daily_study_recommendation(user, save=False)

    subject_rows = []
    for subject in subjects[:8]:
        readiness = subject_readiness(subject)
        weak_topics = [topic.title for topic in subject.weak_topics.filter(is_completed=False)[:4]]
        subject_rows.append({
            "id": subject.id,
            "name": subject.name,
            "exam_date": subject.exam_date.isoformat(),
            "days_remaining": max((subject.exam_date - today).days, 0),
            "difficulty": subject.difficulty,
            "priority": subject.priority,
            "readiness": readiness["readiness"],
            "quiz_average": readiness["quiz_average"],
            "weak_topics": weak_topics,
        })

    quiz_rows = [
        {
            "subject": attempt.subject.name if attempt.subject else "General",
            "topic": attempt.weak_topic.title if attempt.weak_topic else "",
            "score": attempt.score_percent,
            "difficulty": attempt.difficulty,
            "weak_topics": attempt.weak_topics,
        }
        for attempt in attempts
    ]

    return {
        "today": today.isoformat(),
        "subjects": subject_rows,
        "upcoming_exams": [item for item in subject_rows if item["days_remaining"] >= 0][:5],
        "analytics": analytics,
        "focus": focus,
        "burnout": burnout,
        "quiz_attempts": quiz_rows,
        "memory": memories,
        "daily_recommendation": daily,
    }


def mentor_prompt(user, message, mode="exam", depth="balanced"):
    context = mentor_context(user)
    mode_config = MENTOR_MODE_CONFIG.get(mode, MENTOR_MODE_CONFIG["exam"])
    return (
        "You are an intelligent personal study mentor, not a generic chatbot.\n"
        f"Mode: {mode_config['label']} ({mode_config['style']}).\n"
        f"Response depth: {depth}.\n"
        "Use the student's context. Be specific, structured, and academically useful.\n"
        "Always include diagnosis, next action, and a short checkpoint. Avoid empty motivation.\n\n"
        f"Student context JSON:\n{json.dumps(context, default=str)[:6000]}\n\n"
        f"Student message: {message}\n"
    )


def call_external_ai(prompt):
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key or not os.environ.get("OPENAI_API_KEY"):
        return ""
    payload = json.dumps({
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": "You are a concise, contextual AI study mentor."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.45,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception:
        return ""


def update_mentor_memory(user, message):
    text = message.lower()
    if "i prefer" in text or "my goal" in text or "i like" in text:
        AIMemory.objects.update_or_create(
            user=user,
            key="student_preference",
            defaults={"value": message[:500], "confidence": 72},
        )
    if "weak in" in text or "weak at" in text:
        AIMemory.objects.update_or_create(
            user=user,
            key="declared_weakness",
            defaults={"value": message[:500], "confidence": 82},
        )


def heuristic_mentor_reply(user, message, mode="exam", depth="balanced"):
    text = message.lower()
    context = mentor_context(user)
    subjects = context["subjects"]
    weakest = min(subjects, key=lambda item: item["readiness"], default=None)
    closest = min(subjects, key=lambda item: item["days_remaining"], default=None)
    daily = context["daily_recommendation"]
    burnout = context["burnout"]
    focus = context["focus"]
    quiz = context["quiz_attempts"][0] if context["quiz_attempts"] else None
    target = weakest or closest

    if "today" in text or "study" in text or "plan" in text:
        return (
            f"### Today's Mentor Plan\n"
            f"**Diagnosis:** {closest['name'] if closest else 'Your next subject'} is the nearest exam pressure point, and your current focus score is **{focus['focus_score']}%**.\n\n"
            f"**Study order:**\n"
            f"1. {daily['study_focus']} for **{round(daily['estimated_minutes'] * 0.55)} minutes**.\n"
            f"2. {daily['revision_focus'] or 'Revise one weak topic'} for **{round(daily['estimated_minutes'] * 0.30)} minutes**.\n"
            f"3. End with a 10-minute active recall checkpoint.\n\n"
            f"**Checkpoint:** If you cannot explain the topic without notes, schedule it again tomorrow."
        )
    if "quiz" in text:
        subject_name = target["name"] if target else "your weakest subject"
        topic = target["weak_topics"][0] if target and target["weak_topics"] else "core concepts"
        difficulty = target["difficulty"] if target else "medium"
        last_score = f"; your last quiz was {quiz['score']}%" if quiz else ""
        return (
            f"### Quiz Drill\n"
            f"**Diagnosis:** {subject_name} needs evidence-based practice{last_score}.\n\n"
            f"**Generate:** 5-10 **{difficulty}** questions on **{topic}**.\n"
            f"**Rule:** After every wrong answer, write why the correct option wins and why your option failed.\n\n"
            f"**Checkpoint:** Retake only the missed topic after 24 hours."
        )
    if "explain" in text or "what is" in text or "concept" in text:
        focus_topic = target["weak_topics"][0] if target and target["weak_topics"] else "this concept"
        detail = "with one worked example and one exam-style trap" if depth != "concise" else "in three bullets"
        return (
            f"### Concept Mentor: {focus_topic}\n"
            f"**Step 1: Core idea**\nExplain the rule in one sentence before reading notes.\n\n"
            f"**Step 2: Recognition clues**\nList what the question shows when it is testing this concept.\n\n"
            f"**Step 3: Application**\nPractice {detail}.\n\n"
            f"**Checkpoint:** If you can solve a mixed example without notes, move to revision. If not, stay with fundamentals."
        )
    if "burnout" in text or "tired" in text or "stress" in text:
        recovery = "\n".join(f"- {item}" for item in burnout.get("recovery_plan", [])[:3])
        return (
            f"### Study Health Check\n"
            f"**Diagnosis:** Burnout risk is **{burnout['risk']}%** and wellness score is **{burnout.get('wellness_score', 100 - burnout['risk'])}%**.\n\n"
            f"**Adjustment:** {burnout['recommendation']}\n\n"
            f"**Recovery actions:**\n{recovery}"
        )
    readiness_text = f" at {target['readiness']}% readiness" if target else ""
    next_topic = target["weak_topics"][0] if target and target["weak_topics"] else daily["study_focus"]
    return (
        f"### Mentor Readout\n"
        f"**Diagnosis:** Your current highest-leverage subject is **{target['name'] if target else 'not set yet'}**{readiness_text}.\n\n"
        f"**Next action:** Work on **{next_topic}** using active recall, then do a short quiz.\n\n"
        f"**Checkpoint:** Bring me your score or the exact part that felt unclear, and I will adjust the next block."
    )


def mentor_reply(user, message, mode="exam", depth="balanced", conversation=None):
    update_mentor_memory(user, message)
    prompt = mentor_prompt(user, message, mode, depth)
    reply = call_external_ai(prompt) or heuristic_mentor_reply(user, message, mode, depth)
    if conversation:
        MentorMessage.objects.create(user=user, conversation=conversation, role="user", content=message, mode=mode)
        MentorMessage.objects.create(user=user, conversation=conversation, role="assistant", content=reply, mode=mode)
        if conversation.title == "Mentor conversation":
            conversation.title = message[:72]
            conversation.mode = mode
            conversation.save(update_fields=["title", "mode", "updated_at"])
    return reply


def mentor_room_payload(user):
    context = mentor_context(user)
    subjects = context["subjects"]
    weakest = min(subjects, key=lambda item: item["readiness"], default=None)
    strongest = max(subjects, key=lambda item: item["readiness"], default=None)
    insights = [
        {
            "title": "Weak-topic alert",
            "detail": f"{weakest['name']} needs attention at {weakest['readiness']}% readiness." if weakest else "Add subjects to unlock weak-topic alerts.",
            "severity": "warning" if weakest and weakest["readiness"] < 60 else "info",
        },
        {
            "title": "Focus consistency",
            "detail": f"Current focus score is {context['focus']['focus_score']}%. {context['focus']['recommendation']}",
            "severity": "info",
        },
        {
            "title": "Study health",
            "detail": f"Burnout risk is {context['burnout']['risk']}%. {context['burnout']['recommendation']}",
            "severity": "warning" if context["burnout"]["risk"] >= 60 else "success",
        },
    ]
    for item in insights:
        StudyInsight.objects.create(user=user, **item, source="mentor")
    recommendations = [
        {
            "title": "Daily focus block",
            "action": context["daily_recommendation"]["recommendation"],
            "priority": context["daily_recommendation"]["priority"],
        },
        {
            "title": "Weekly review",
            "action": f"Strongest: {strongest['name'] if strongest else 'n/a'}. Weakest: {weakest['name'] if weakest else 'n/a'}. Convert missed goals into two recovery blocks.",
            "priority": "medium",
        },
    ]
    for item in recommendations:
        MentorRecommendation.objects.create(user=user, **item)
    return {
        "context": context,
        "daily_guidance": context["daily_recommendation"],
        "study_health": context["burnout"],
        "weekly_review": {
            "strongest_subject": strongest,
            "weakest_subject": weakest,
            "focus_score": context["focus"]["focus_score"],
            "completion_rate": context["analytics"].get("completion_rate", 0),
        },
        "insights": insights,
        "recommendations": recommendations,
    }


def burnout_detection(user):
    today = timezone.localdate()
    week_start = today - timedelta(days=6)
    logs = ProgressLog.objects.filter(user=user, logged_at__date__gte=week_start)
    sessions = StudySession.objects.filter(user=user, date__gte=week_start, date__lte=today) # Can be empty
    focus = PomodoroSession.objects.filter(user=user, started_at__date__gte=week_start)
    study_minutes = logs.aggregate(total=Sum("studied_minutes"))["total"] or 0
    missed_tasks = sessions.filter(date__lt=today, is_completed=False).count()
    planned_tasks = sessions.count()
    focus_cycles = focus.aggregate(total=Sum("completed_cycles"))["total"] or 0
    active_days = logs.extra({"day": "date(logged_at)"}).values("day").distinct().count()
    workload_score = min(study_minutes / 18, 45)
    missed_score = min(missed_tasks * 8, 30) # Can be 0
    inactivity_score = max(0, 4 - active_days) * 8
    low_productivity_score = 15 if planned_tasks and missed_tasks / planned_tasks > 0.5 else 0
    long_focus_score = 10 if focus_cycles >= 12 else 0
    risk = clamp(workload_score + missed_score + inactivity_score + low_productivity_score + long_focus_score)

    stress_indicators = []
    if study_minutes > 900:
        stress_indicators.append("High study load this week")
    if missed_tasks >= 3:
        stress_indicators.append("Multiple skipped sessions")
    if active_days <= 2:
        stress_indicators.append("Low consistency")
    if focus_cycles >= 12:
        stress_indicators.append("Long focus workload")

    if risk >= 70:
        recommendation = "Take a longer recovery break today, reduce the next plan by 25%, and focus only on the highest-priority revision."
        recovery_plan = ["Schedule one light revision block", "Take a 30 minute recovery break", "Move low-priority tasks to tomorrow"]
    elif risk >= 40:
        recommendation = "Use shorter focus blocks, add a real break after every two sessions, and move low-priority tasks to tomorrow."
        recovery_plan = ["Use 25 minute focus blocks", "Keep breaks protected", "Study one weak topic only"]
    else:
        recommendation = "Your workload looks balanced. Keep breaks scheduled and stop after your planned focus blocks."
        recovery_plan = ["Maintain current rhythm", "End with active recall", "Keep one recovery break"]

    wellness_score = clamp(100 - risk)
    productivity_health = "Needs recovery" if risk >= 70 else "Watch load" if risk >= 40 else "Balanced"
    BurnoutSnapshot.objects.create(
        user=user,
        risk=risk,
        wellness_score=wellness_score,
        stress_indicators=stress_indicators,
        recommendations=recovery_plan,
    )

    return {
        "risk": risk,
        "wellness_score": wellness_score,
        "study_minutes_7d": study_minutes,
        "missed_tasks": missed_tasks,
        "active_days": active_days,
        "focus_cycles": focus_cycles,
        "stress_indicators": stress_indicators,
        "recovery_plan": recovery_plan,
        "productivity_health": productivity_health,
        "recommendation": recommendation,
    }


def daily_study_recommendation(user, save=True):
    today = timezone.localdate()
    subjects = list(Subject.objects.filter(user=user, exam_date__gte=today).prefetch_related("weak_topics").order_by("exam_date"))
    if not subjects:
        payload = {
            "title": "Set up your first study target",
            "recommendation": "Add subjects, exam dates, and weak topics so AI can create a daily study recommendation.",
            "study_focus": "Add subjects",
            "revision_focus": "",
            "estimated_minutes": 30,
            "priority": "medium",
            "confidence": 45,
            "study_order": ["Add subjects", "Add weak topics", "Generate a schedule"],
            "source_date": today,
            "timeline": [],
        }
        return payload

    incomplete_sessions = StudySession.objects.filter(user=user, date__lte=today, is_completed=False).select_related("subject", "weak_topic").order_by("date", "start_time")
    focus_summary = focus_mode_summary(user)
    ranked = []
    for subject in subjects:
        days_remaining = max((subject.exam_date - today).days, 0)
        weak_topics = list(subject.weak_topics.filter(is_completed=False))
        recent_logs = ProgressLog.objects.filter(user=user, subject=subject, logged_at__date__gte=today - timedelta(days=7))
        revision_count = recent_logs.filter(completed=True).count()
        urgency = max(0, 21 - days_remaining) * 3
        weakness = len(weak_topics) * 16
        difficulty = {"high": 28, "medium": 14, "low": 4}.get(subject.difficulty, 10)
        missed = incomplete_sessions.filter(subject=subject).count() * 12
        low_revision = 14 if weak_topics and revision_count == 0 else 0
        ranked.append((urgency + weakness + difficulty + missed + low_revision, subject, weak_topics, days_remaining))

    ranked.sort(key=lambda item: item[0], reverse=True)
    _, subject, weak_topics, days_remaining = ranked[0]
    topic = weak_topics[0].title if weak_topics else "core concepts"
    revision_subject = ranked[1][1].name if len(ranked) > 1 else subject.name
    revision_topic = ranked[1][2][0].title if len(ranked) > 1 and ranked[1][2] else "formula recall"
    priority = "high" if days_remaining <= 7 or weak_topics else "medium"
    estimated_minutes = 90 if priority == "high" else 60
    if focus_summary["focus_score"] < 55:
        estimated_minutes = max(40, estimated_minutes - 20)

    study_order = [
        f"{subject.name}: {topic}",
        f"Revise {revision_subject}: {revision_topic}",
        "Finish with 10 minutes of active recall",
    ]
    timeline = [
        {"label": "Start", "task": study_order[0], "minutes": round(estimated_minutes * 0.55)},
        {"label": "Revision", "task": study_order[1], "minutes": round(estimated_minutes * 0.30)},
        {"label": "Recall", "task": study_order[2], "minutes": max(10, round(estimated_minutes * 0.15))},
    ]
    confidence = clamp(62 + min(len(weak_topics) * 5, 15) + max(0, 10 - days_remaining))
    payload = {
        "title": f"Today: {subject.name}",
        "recommendation": f"Focus on {subject.name} {topic} today for {estimated_minutes} minutes and revise {revision_subject} {revision_topic}.",
        "study_focus": f"{subject.name}: {topic}",
        "revision_focus": f"{revision_subject}: {revision_topic}",
        "estimated_minutes": estimated_minutes,
        "priority": priority,
        "confidence": confidence,
        "study_order": study_order,
        "source_date": today,
        "timeline": timeline,
    }

    if save:
        AIRecommendation.objects.create(
            user=user,
            title=payload["title"],
            recommendation=payload["recommendation"],
            study_focus=payload["study_focus"],
            revision_focus=payload["revision_focus"],
            estimated_minutes=payload["estimated_minutes"],
            priority=payload["priority"],
            confidence=payload["confidence"],
            study_order=payload["study_order"],
            source_date=today,
        )
    return payload


def performance_predictions(user):
    predictions = []
    for subject in Subject.objects.filter(user=user).prefetch_related("weak_topics"):
        readiness = subject_readiness(subject) # Ensure this is robust
        days_remaining = max((subject.exam_date - timezone.localdate()).days, 0)
        time_boost = min(days_remaining * 1.5, 12)
        urgency_penalty = 12 if days_remaining <= 3 and readiness["readiness"] < 70 else 0
        predicted_score = clamp(readiness["readiness"] * 0.82 + readiness["quiz_average"] * 0.18 + time_boost - urgency_penalty)
        predictions.append(
            {
                "subject_id": subject.id,
                "subject": subject.name,
                "predicted_score": predicted_score,
                "confidence": clamp(55 + readiness["study_consistency_days"] * 8 + readiness["revision_frequency"] * 4),
                "days_remaining": days_remaining,
                "drivers": [
                    f"{readiness['completion']}% topic completion",
                    f"{readiness['quiz_average']}% quiz average",
                    f"{readiness['revision_frequency']} revision logs",
                ],
            }
        )
    return sorted(predictions, key=lambda item: item["predicted_score"])


def smart_notifications(user):
    now = timezone.now()
    created = []
    upcoming = Subject.objects.filter(user=user, exam_date__gte=timezone.localdate()).order_by("exam_date")[:3]
    for subject in upcoming:
        days = max((subject.exam_date - timezone.localdate()).days, 0)
        title = f"Upcoming exam: {subject.name}"
        if not Notification.objects.filter(user=user, title=title, is_read=False).exists():
            created.append(
                Notification.objects.create(
                    user=user,
                    title=title,
                    message=f"{days} day(s) left. Review weak topics and run a short quiz today.",
                    scheduled_for=now,
                )
            )

    for item in revision_recommendations(user, horizon_days=3)[:3]:
        title = f"Revision due: {item['topic']}"
        if not Notification.objects.filter(user=user, title=title, is_read=False).exists():
            created.append(
                Notification.objects.create(
                    user=user,
                    title=title,
                    message=f"{item['subject']} needs spaced revision on {item['date']}.",
                    scheduled_for=now,
                )
            )

    burnout = burnout_detection(user)
    if burnout["risk"] >= 40 and not Notification.objects.filter(user=user, title="Balance your workload", is_read=False).exists():
        created.append(
            Notification.objects.create(
                user=user,
                title="Balance your workload",
                message=burnout["recommendation"],
                scheduled_for=now,
            )
        )

    return Notification.objects.filter(user=user, is_read=False).order_by("scheduled_for")[:10]


def focus_mode_summary(user):
    recent = FocusSession.objects.filter(user=user).order_by("-started_at")[:10]
    total = recent.count()
    focused = sum(session.focused_minutes for session in recent)
    planned = sum(session.planned_minutes for session in recent) or 1
    interruptions = sum(session.interruptions for session in recent)
    focus_score = clamp((focused / planned) * 100 - interruptions * 5)
    recommendation = (
        "Use full-screen focus mode and silence notifications for the next block."
        if interruptions >= 3
        else "Your focus trend is steady. Keep one clear task per session."
    )
    return {
        "focus_score": focus_score,
        "sessions": total,
        "focused_minutes": focused,
        "interruptions": interruptions,
        "recommendation": recommendation,
    }


def group_leaderboard(group):
    rows = []
    for membership in group.memberships.select_related("user"):
        user = membership.user # Ensure user exists
        minutes = ProgressLog.objects.filter(user=user).aggregate(total=Sum("studied_minutes"))["total"] or 0
        completed = WeakTopic.objects.filter(user=user, is_completed=True).count()
        quizzes = ProgressLog.objects.filter(user=user).exclude(quiz_score=None).aggregate(avg=Avg("quiz_score"))["avg"] or 0
        score = clamp(minutes / 6 + completed * 10 + quizzes * 0.4)
        rows.append(
            {
                "username": user.username,
                "study_minutes": minutes,
                "completed_topics": completed,
                "quiz_average": round(quizzes, 1),
                "score": score,
            }
        )
    return sorted(rows, key=lambda item: item["score"], reverse=True)


def _parse_study_time(value, fallback="18:00"):
    try:
        return datetime.strptime(value or fallback, "%H:%M").time()
    except (TypeError, ValueError):
        return datetime.strptime(fallback, "%H:%M").time()


def _upsert_schedule_subjects(user, subjects_payload):
    today = timezone.localdate()
    subjects_payload = subjects_payload or []
    created_or_updated = []

    for item in subjects_payload:
        name = str(item.get("name", "")).strip()
        exam_date = item.get("exam_date")
        if not name or not exam_date:
            continue
        try:
            parsed_exam_date = datetime.strptime(exam_date, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            continue
        if parsed_exam_date < today:
            continue

        weak_topics = [topic.strip() for topic in str(item.get("weak_topics", "")).split(",") if topic.strip()]
        difficulty = item.get("difficulty") if item.get("difficulty") in {"low", "medium", "high"} else "medium"
        priority = "high" if weak_topics or difficulty == "high" else difficulty

        try:
            confidence = int(item.get("confidence") or (35 if weak_topics else 60))
        except (TypeError, ValueError):
            confidence = 35 if weak_topics else 60

        subject, _ = Subject.objects.update_or_create(
            user=user,
            name=name,
            defaults={
                "exam_date": parsed_exam_date,
                "difficulty": difficulty,
                "priority": priority,
                "confidence": max(0, min(confidence, 100)),
            },
        )
        created_or_updated.append(subject.id)

        for topic_title in weak_topics:
            WeakTopic.objects.get_or_create(
                user=user,
                subject=subject,
                title=topic_title,
                defaults={"understanding_level": "weak"},
            )

    return created_or_updated


def generate_study_plan(
    user,
    daily_hours=None,
    start_date=None,
    days=7,
    preferred_study_time=None,
    break_duration=None,
    subjects_payload=None,
    plan_title=None,
):
    today = timezone.localdate()
    start_date = start_date or today # Ensure start_date is a date object
    profile, _ = Profile.objects.get_or_create(user=user)
    daily_hours = Decimal(daily_hours or profile.daily_study_hours or 2)
    daily_hours = max(Decimal("0.5"), min(daily_hours, Decimal("12")))
    break_duration = max(0, min(int(break_duration or 10), 45))
    days = max(1, min(int(days or 7), 30))
    end_date = start_date + timedelta(days=days - 1)
    preferred_time = _parse_study_time(preferred_study_time)

    selected_subject_ids = _upsert_schedule_subjects(user, subjects_payload)

    subject_queryset = Subject.objects.filter(user=user, exam_date__gte=today).prefetch_related("weak_topics")
    if selected_subject_ids:
        subject_queryset = subject_queryset.filter(id__in=selected_subject_ids)
    subjects = list(subject_queryset)
    if not subjects:
        raise ValueError("Add at least one upcoming subject before generating a plan.")

    plan = StudyPlan.objects.create(
        user=user,
        title=plan_title or f"AI Smart Schedule {start_date:%d %b}",
        start_date=start_date,
        end_date=end_date,
        daily_hours=daily_hours,
    )

    block_minutes = 50 if float(daily_hours) >= 3 else 45
    available_minutes = int(float(daily_hours) * 60)
    blocks_per_day = max(1, available_minutes // (block_minutes + max(break_duration, 0)))
    base_start = datetime.combine(start_date, preferred_time)

    missed_sessions_queryset = (
        StudySession.objects.filter(
            user=user,
            date__lt=today,
            is_completed=False,
            subject__isnull=False,
        )
        .select_related("subject", "weak_topic")
        .order_by("date")[:10]
    )
    missed_sessions = list(missed_sessions_queryset)  # Convert to list for pop()

    def smart_rank(subject):
        days_to_exam = max((subject.exam_date - today).days, 0)
        weak_count = subject.weak_topics.filter(is_completed=False).count()
        urgency = max(0, 45 - days_to_exam) * 2
        weakness = weak_count * 18
        difficulty = {"high": 36, "medium": 18, "low": 6}.get(subject.difficulty, 12)
        priority = {"high": 28, "medium": 12, "low": 4}.get(subject.priority, 8)
        return subject_score(subject) + urgency + weakness + difficulty + priority

    ranked_subjects = sorted(subjects, key=smart_rank, reverse=True) # Can be empty if no subjects
    created = []

    for day_offset in range(days):
        if not ranked_subjects: # Guard against no subjects
            break
        
        session_date = start_date + timedelta(days=day_offset)
        day_start = base_start + timedelta(days=day_offset)

        for block in range(blocks_per_day):
            missed = missed_sessions.pop(0) if missed_sessions else None
            subject = missed.subject if missed else ranked_subjects[(day_offset + block) % len(ranked_subjects)]
            weak_topics = list(subject.weak_topics.filter(is_completed=False))
            topic = missed.weak_topic if missed and missed.weak_topic else (
                weak_topics[(day_offset + block) % len(weak_topics)] if weak_topics else None
            )
            readiness = subject_readiness(subject)
            intervals = revision_interval_days(topic, subject, readiness["quiz_average"]) if topic else [1, 3, 7]
            days_to_exam = (subject.exam_date - session_date).days
            revision_day = day_offset + 1 in intervals or days_to_exam <= 5
            task_type = "revision" if revision_day else "study"
            if missed:
                task_type = "revision"
            title_topic = topic.title if topic else "Core Concepts"
            start_dt = day_start + timedelta(minutes=block * (block_minutes + break_duration))
            end_dt = start_dt + timedelta(minutes=block_minutes)
            prefix = "Catch up: " if missed else ""

            created.append(
                StudySession.objects.create(
                    user=user,
                    plan=plan,
                    subject=subject,
                    weak_topic=topic,
                    date=session_date,
                    start_time=start_dt.time(),
                    end_time=end_dt.time(),
                    task_type=task_type,
                    title=f"{prefix}{subject.name} - {title_topic} {task_type.title()}",
                )
            )

            if break_duration:
                break_start = end_dt
                break_end = break_start + timedelta(minutes=break_duration)
                created.append(
                    StudySession.objects.create(
                        user=user,
                        plan=plan,
                        subject=None,
                        weak_topic=None,
                        date=session_date,
                        start_time=break_start.time(),
                        end_time=break_end.time(),
                        task_type="break",
                        title=f"{break_duration} min recovery break",
                    )
                )

        quiz_dt = day_start + timedelta(minutes=blocks_per_day * (block_minutes + break_duration))
        subject = ranked_subjects[day_offset % len(ranked_subjects)]
        created.append(
            # Ensure subject is not None before creating StudySession
            # This case should be handled by the 'if not ranked_subjects' guard above
            # but adding a check for robustness
            StudySession.objects.create(
                user=user,
                plan=plan,
                subject=subject,
                date=session_date,
                start_time=quiz_dt.time(),
                end_time=(quiz_dt + timedelta(minutes=30)).time(),
                task_type="quiz",
                title=f"{subject.name} Quiz Practice",
            )
        )

    for subject in ranked_subjects[:3]:
        Notification.objects.create(
            user=user,
            title=f"Revision reminder: {subject.name}",
            message="Revise weak topics today using the Day 1 / Day 3 / Day 7 cycle.",
            scheduled_for=timezone.now() + timedelta(hours=2),
        )

    return plan, created


def generate_quiz_questions(user, subject, weak_topic=None, count=5, difficulty=None):
    if not difficulty and subject:
        recent_avg = ProgressLog.objects.filter(
            user=user, subject=subject
        ).exclude(quiz_score=None).order_by("-logged_at")[:5].aggregate(Avg("quiz_score"))["quiz_score__avg"]
        
        if recent_avg and recent_avg > 85:
            difficulty = "high"
        elif recent_avg and recent_avg < 50:
            difficulty = "low"
        else:
            difficulty = subject.difficulty

    focus = weak_topic.title if weak_topic else subject.name
    templates = topic_quiz_templates(subject.name, focus, difficulty)
    questions = []
    for index, template in enumerate(templates[: max(1, min(count, len(templates)))], start=1):
        options = shuffled_unique_options(template["options"], template["answer"])
        explanation = enrich_quiz_explanation(template, subject.name, focus)
        questions.append(
            QuizQuestion.objects.create(
                user=user,
                subject=subject,
                weak_topic=weak_topic,
                question_type="mcq",
                question=template["question"],
                options=options,
                answer=template["answer"],
                explanation=explanation,
                difficulty=difficulty,
            )
        )
    return questions


def enrich_quiz_explanation(template, subject_name, focus):
    distractors = [option for option in template["options"] if option != template["answer"]][:3]
    why_wrong = " ".join(
        f"**{option}** is not the best choice because it does not match the tested concept."
        for option in distractors
    )
    return (
        f"**Correct answer:** {template['answer']}.\n\n"
        f"{template['explanation']}\n\n"
        f"**Why the other options are weaker:** {why_wrong}\n\n"
        f"**Revision cue:** In {subject_name}, connect this question to **{focus}** and add one similar example to your mistake notebook."
    )


def shuffled_unique_options(options, answer):
    unique = []
    for option in [answer, *options]:
        if option not in unique:
            unique.append(option)
    while len(unique) < 4:
        unique.append(f"None of the above {len(unique) + 1}")
    unique = unique[:4]
    random.SystemRandom().shuffle(unique)
    return unique


MOCK_PATTERNS = {
    "JEE": {"duration_minutes": 180, "marks_correct": 4, "marks_wrong": -1, "sections": ["Physics", "Chemistry", "Mathematics"]},
    "NEET": {"duration_minutes": 180, "marks_correct": 4, "marks_wrong": -1, "sections": ["Physics", "Chemistry", "Biology"]},
    "UPSC": {"duration_minutes": 120, "marks_correct": 2, "marks_wrong": -0.66, "sections": ["General Studies", "Reasoning", "Current Affairs"]},
    "Placement": {"duration_minutes": 60, "marks_correct": 1, "marks_wrong": -0.25, "sections": ["Aptitude", "Reasoning", "Technical"]},
    "University": {"duration_minutes": 90, "marks_correct": 2, "marks_wrong": 0, "sections": ["Concepts", "Applications", "Mixed Practice"]},
}


def infer_mock_exam(subjects):
    names = " ".join(subject.name.lower() for subject in subjects)
    if "biology" in names:
        return "NEET"
    if any(token in names for token in ["physics", "chemistry", "math", "mathematics"]):
        return "JEE"
    if any(token in names for token in ["computer", "react", "python", "data structures"]):
        return "Placement"
    return "University"


def generate_mock_test(user, test_type="full", subject_id=None, difficulty="medium", question_count=12):
    subjects = Subject.objects.filter(user=user).prefetch_related("weak_topics").order_by("exam_date")
    if subject_id:
        subjects = subjects.filter(id=subject_id)
    subjects = list(subjects)
    if not subjects:
        subjects = [type("SubjectStub", (), {"id": None, "name": "Study Skills", "difficulty": difficulty, "weak_topics": WeakTopic.objects.none()})()]

    exam = infer_mock_exam(subjects)
    pattern = MOCK_PATTERNS[exam]
    count = max(5, min(int(question_count or 12), 30))
    questions = []

    for index in range(count):
        subject = subjects[index % len(subjects)]
        weak_topic = None
        if hasattr(subject, "weak_topics"):
            weak_topic = subject.weak_topics.filter(is_completed=False).first()
        focus = weak_topic.title if weak_topic else ("Ray Optics" if "physics" in subject.name.lower() else subject.name)
        templates = topic_quiz_templates(subject.name, focus, difficulty)
        template = templates[index % len(templates)]
        section = pattern["sections"][index % len(pattern["sections"])]
        q_type = ["conceptual", "numerical", "reasoning", "assertion-reason", "true-false", "match"][index % 6]
        questions.append(
            {
                "id": f"mock-{index + 1}",
                "section": section,
                "subject": subject.name,
                "topic": focus,
                "type": q_type,
                "difficulty": difficulty if index % 3 else "high",
                "question": template["question"],
                "options": shuffled_unique_options(template["options"], template["answer"]),
                "answer": template["answer"],
                "explanation": enrich_quiz_explanation(template, subject.name, focus),
                "marks_correct": pattern["marks_correct"],
                "marks_wrong": pattern["marks_wrong"],
            }
        )

    total_marks = sum(q["marks_correct"] for q in questions)
    return {
        "exam": exam,
        "test_type": test_type,
        "duration_minutes": max(15, min(pattern["duration_minutes"], count * 4)),
        "negative_marking": pattern["marks_wrong"],
        "total_marks": total_marks,
        "sections": pattern["sections"],
        "questions": questions,
        "instructions": [
            "Use the navigator to mark questions for review.",
            "Negative marking applies to wrong answers.",
            "Submit only after reviewing flagged questions.",
        ],
    }


def topic_quiz_templates(subject_name, focus, difficulty):
    subject_key = subject_name.lower()
    focus_key = focus.lower()

    if "cell" in focus_key or "biology" in subject_key:
        base = [
            {
                "question": "Which organelle is primarily responsible for ATP production in eukaryotic cells?",
                "options": ["Mitochondrion", "Ribosome", "Golgi apparatus", "Nucleolus"],
                "answer": "Mitochondrion",
                "explanation": "Mitochondria carry out cellular respiration and generate most ATP through oxidative phosphorylation.",
            },
            {
                "question": "The fluid mosaic model mainly describes which cell structure?",
                "options": ["Plasma membrane", "Cell wall", "Chromosome", "Centrosome"],
                "answer": "Plasma membrane",
                "explanation": "The plasma membrane is a dynamic phospholipid bilayer with mobile proteins embedded in it.",
            },
            {
                "question": "Which structure controls exchange between the nucleus and cytoplasm?",
                "options": ["Nuclear pore complex", "Lysosome", "Smooth ER", "Vacuole"],
                "answer": "Nuclear pore complex",
                "explanation": "Nuclear pores regulate RNA and protein traffic across the nuclear envelope.",
            },
            {
                "question": "A cell with abundant rough ER is most likely specialized for what task?",
                "options": ["Protein secretion", "Lipid storage", "DNA replication only", "Osmotic balance only"],
                "answer": "Protein secretion",
                "explanation": "Rough ER has ribosomes and is prominent in cells producing secreted or membrane proteins.",
            },
            {
                "question": "Which statement best distinguishes prokaryotic cells from eukaryotic cells?",
                "options": ["Prokaryotes lack a membrane-bound nucleus", "Prokaryotes always lack DNA", "Eukaryotes lack ribosomes", "Eukaryotes never have membranes"],
                "answer": "Prokaryotes lack a membrane-bound nucleus",
                "explanation": "Prokaryotes contain DNA but do not package it inside a membrane-bound nucleus.",
            },
        ]
    elif "optic" in focus_key or "ray" in focus_key or "physics" in subject_key:
        base = [
            {
                "question": "A convex lens forms a real image when the object is placed beyond which point?",
                "options": ["Beyond the focal point", "At the optical center", "Between lens and focal point", "At the pole only"],
                "answer": "Beyond the focal point",
                "explanation": "For a convex lens, objects beyond F generally form real, inverted images on the opposite side.",
            },
            {
                "question": "For refraction from air to glass, the ray bends toward the normal because:",
                "options": ["Light slows down in glass", "Light speeds up in glass", "Frequency becomes zero", "Wavelength becomes infinite"],
                "answer": "Light slows down in glass",
                "explanation": "Glass has a higher refractive index than air, so light slows and bends toward the normal.",
            },
            {
                "question": "Which formula is used for a spherical mirror under the Cartesian sign convention?",
                "options": ["1/f = 1/v + 1/u", "f = u + v", "n = c + v", "P = IV"],
                "answer": "1/f = 1/v + 1/u",
                "explanation": "The mirror formula relates focal length, image distance, and object distance.",
            },
            {
                "question": "Total internal reflection requires light to travel from:",
                "options": ["Denser to rarer medium with angle above critical angle", "Rarer to denser medium at any angle", "Vacuum to air only", "Any medium at zero incidence"],
                "answer": "Denser to rarer medium with angle above critical angle",
                "explanation": "TIR occurs only when incidence exceeds the critical angle from optically denser to rarer medium.",
            },
            {
                "question": "Power of a lens is measured in:",
                "options": ["Diopter", "Tesla", "Joule", "Ohm"],
                "answer": "Diopter",
                "explanation": "Lens power is reciprocal of focal length in meters and is measured in diopters.",
            },
        ]
    elif "react" in subject_key or "hook" in focus_key:
        base = [
            {
                "question": "Which React Hook is used to run side effects after render?",
                "options": ["useEffect", "useMemo", "useRef", "useId"],
                "answer": "useEffect",
                "explanation": "useEffect runs side effects such as subscriptions, data fetching, and DOM synchronization.",
            },
            {
                "question": "What does the dependency array in useEffect control?",
                "options": ["When the effect re-runs", "The CSS scope", "The route path", "The JSX parser"],
                "answer": "When the effect re-runs",
                "explanation": "React compares dependencies and re-runs the effect when one of them changes.",
            },
            {
                "question": "Which Hook stores a mutable value without causing re-render when changed?",
                "options": ["useRef", "useState", "useEffect", "useReducer"],
                "answer": "useRef",
                "explanation": "Updating ref.current does not trigger a render, which is useful for timers and DOM references.",
            },
            {
                "question": "Why should Hooks not be called conditionally?",
                "options": ["React relies on consistent call order", "Hooks are CSS-only", "They require class components", "They disable JSX"],
                "answer": "React relies on consistent call order",
                "explanation": "Hooks must be called in the same order every render so React can associate state correctly.",
            },
            {
                "question": "Which Hook is best for memoizing an expensive derived value?",
                "options": ["useMemo", "useRef", "useId", "useInsertionEffect"],
                "answer": "useMemo",
                "explanation": "useMemo caches a computed value until its dependencies change.",
            },
        ]
    else:
        base = [
            {
                "question": f"What is the most important first step when revising {focus}?",
                "options": ["Recall the core definition and conditions", "Skip examples", "Memorize unrelated facts", "Avoid practice questions"],
                "answer": "Recall the core definition and conditions",
                "explanation": f"Strong performance in {focus} starts with the core rule, when it applies, and one worked example.",
            },
            {
                "question": f"Which practice method best improves retention for {focus}?",
                "options": ["Active recall followed by error review", "Passive rereading only", "Highlighting without testing", "Changing topics every minute"],
                "answer": "Active recall followed by error review",
                "explanation": "Testing yourself and correcting mistakes builds stronger memory than passive review.",
            },
            {
                "question": f"When a question on {focus} feels difficult, what should you identify first?",
                "options": ["Given data and target concept", "The longest answer", "A random formula", "The page number"],
                "answer": "Given data and target concept",
                "explanation": "Mapping the known information to the tested concept prevents guessing.",
            },
            {
                "question": f"Which signal suggests you should revise {focus} again soon?",
                "options": ["Repeated mistakes in similar questions", "One correct answer", "A short study session", "Reading the title"],
                "answer": "Repeated mistakes in similar questions",
                "explanation": "Repeated errors reveal a weak pattern that benefits from spaced revision.",
            },
            {
                "question": f"What should your final review of {focus} include?",
                "options": ["Formula/concept sheet, mistakes, and one mixed quiz", "Only new topics", "No questions", "Unrelated videos"],
                "answer": "Formula/concept sheet, mistakes, and one mixed quiz",
                "explanation": "Final review should consolidate concepts and test transfer through mixed practice.",
            },
        ]

    if difficulty in {"high", "hard"}:
        base[0]["question"] = f"Advanced: {base[0]['question']}"
    elif difficulty in {"low", "easy"}:
        base[0]["question"] = f"Foundation: {base[0]['question']}"
    return base


CAREER_BLUEPRINTS = {
    "frontend": {
        "skills": ["HTML", "CSS", "JavaScript", "React", "Accessibility", "State Management", "Testing", "Performance"],
        "projects": ["Responsive portfolio", "Component library", "Analytics dashboard", "Progressive web app"],
    },
    "full stack": {
        "skills": ["JavaScript", "React", "REST APIs", "PostgreSQL", "Authentication", "Caching", "Testing", "Deployment"],
        "projects": ["Task management SaaS", "E-commerce platform", "Realtime chat app", "AI study planner"],
    },
    "data": {
        "skills": ["Python", "Statistics", "SQL", "Pandas", "Machine Learning", "Visualization", "Model Evaluation", "Data Storytelling"],
        "projects": ["EDA report", "Prediction model", "Recommendation engine", "BI dashboard"],
    },
    "ai": {
        "skills": ["Python", "Prompt Engineering", "Embeddings", "RAG", "Evaluation", "Agents", "APIs", "Deployment"],
        "projects": ["AI notes assistant", "RAG knowledge base", "Quiz generator", "Career mentor system"],
    },
    "devops": {
        "skills": ["Linux", "Docker", "CI/CD", "Cloud", "Monitoring", "Networking", "Security", "Infrastructure as Code"],
        "projects": ["Dockerized API", "CI/CD pipeline", "Cloud deployment", "Monitoring dashboard"],
    },
    "design": {
        "skills": ["User Research", "Wireframing", "Design Systems", "Figma", "Accessibility", "Prototyping", "Usability Testing", "Portfolio Storytelling"],
        "projects": ["Mobile app redesign", "SaaS dashboard system", "Design system", "UX case study"],
    },
}


def career_blueprint_for(target_career):
    career = (target_career or "").lower()
    if "full" in career:
        return CAREER_BLUEPRINTS["full stack"]
    if "data" in career:
        return CAREER_BLUEPRINTS["data"]
    if "ai" in career or "machine" in career:
        return CAREER_BLUEPRINTS["ai"]
    if "devops" in career or "cloud" in career:
        return CAREER_BLUEPRINTS["devops"]
    if "design" in career or "ux" in career:
        return CAREER_BLUEPRINTS["design"]
    return CAREER_BLUEPRINTS["frontend"]


def split_technologies(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def build_career_prompt(target_career, skill_level, weekly_hours, timeline_weeks, preferred_technologies):
    return (
        "Act as a personal AI career mentor. Create a concise, practical career roadmap summary.\n"
        f"Target career: {target_career}\n"
        f"Current skill level: {skill_level}\n"
        f"Weekly learning hours: {weekly_hours}\n"
        f"Timeline weeks: {timeline_weeks}\n"
        f"Preferred technologies: {format_topic_list(preferred_technologies, 'not specified')}\n"
        "Focus on skill gaps, portfolio proof, interview readiness, and adaptive learning strategy."
    )


def generate_career_roadmap(user, payload):
    target_career = (payload.get("target_career") or "Frontend Developer").strip()
    skill_level = payload.get("skill_level") or "beginner"
    weekly_hours = max(3, min(int(payload.get("weekly_hours") or payload.get("available_study_hours") or 8), 40))
    timeline_weeks = max(4, min(int(payload.get("timeline_weeks") or payload.get("target_timeline") or 12), 52))
    preferred_technologies = split_technologies(payload.get("preferred_technologies"))
    blueprint = career_blueprint_for(target_career)
    skills = list(dict.fromkeys([*preferred_technologies, *blueprint["skills"]]))
    ai_summary = call_external_ai(build_career_prompt(target_career, skill_level, weekly_hours, timeline_weeks, preferred_technologies))

    roadmap = CareerRoadmap.objects.create(
        user=user,
        target_career=target_career,
        skill_level=skill_level,
        weekly_hours=weekly_hours,
        timeline_weeks=timeline_weeks,
        preferred_technologies=preferred_technologies,
        summary=ai_summary or f"{target_career} roadmap built for a {skill_level} learner with {weekly_hours} focused hours per week.",
        revision_strategy="Use weekly active-recall reviews, one project journal, and revisit weak technologies after 3, 7, and 14 days.",
        interview_path="Start with fundamentals, move into project walkthroughs, then practice timed technical and behavioral rounds.",
        adaptive_notes=[
            "Increase project work when quiz scores stay above 80%.",
            "Repeat prerequisite topics when confidence drops below 55%.",
            "Protect at least one review block each week.",
        ],
    )

    phase_plan = [
        ("beginner", "Foundation Phase", skills[:4], 0.22),
        ("intermediate", "Applied Skills Phase", skills[3:7], 0.24),
        ("advanced", "Advanced Systems Phase", skills[5:9], 0.20),
        ("projects", "Project-Building Phase", skills[1:8], 0.22),
        ("interview", "Interview Preparation Phase", skills[2:9], 0.12),
    ]
    for order, (phase_type, title, topics, share) in enumerate(phase_plan, start=1):
        phase_topics = topics or skills[:3]
        CareerRoadmapPhase.objects.create(
            roadmap=roadmap,
            phase_type=phase_type,
            title=title,
            order=order,
            estimated_weeks=max(1, round(timeline_weeks * share)),
            topics=phase_topics,
            learning_goals=[
                f"Build usable confidence in {format_topic_list(phase_topics[:2])}.",
                "Create notes that can be reused for revision and interviews.",
                "Prove the phase with a small deliverable, not passive watching.",
            ],
            recommended_projects=blueprint["projects"][max(0, order - 2): order + 1] or blueprint["projects"][:2],
        )

    for index, skill in enumerate(skills[:10]):
        base = {"beginner": 25, "intermediate": 45, "advanced": 62}.get(skill_level, 30)
        confidence = clamp(base + (8 if skill in preferred_technologies else 0) - index * 2)
        SkillProfile.objects.create(
            user=user,
            roadmap=roadmap,
            name=skill,
            category="technology" if index < 7 else "career",
            current_level=confidence,
            target_level=85,
            confidence=confidence,
            evidence=["Roadmap self-assessment", "Study history", "Preferred technology match" if skill in preferred_technologies else "Required role skill"],
        )

    generate_career_projects(user, roadmap)
    generate_career_readiness(user, roadmap)
    generate_career_insights(user, roadmap)
    return roadmap


def career_skill_gap(user, roadmap=None):
    roadmap = roadmap or CareerRoadmap.objects.filter(user=user).first()
    if not roadmap:
        return []
    completed_topics = WeakTopic.objects.filter(user=user, is_completed=True).count()
    quiz_average = ProgressLog.objects.filter(user=user).exclude(quiz_score=None).aggregate(avg=Avg("quiz_score")).get("avg") or 0
    gaps = []
    for skill in roadmap.skills.all():
        gap = max(0, skill.target_level - skill.current_level)
        if gap < 15:
            continue
        reasons = []
        if quiz_average and quiz_average < 70:
            reasons.append("recent quiz accuracy is below interview-ready level")
        if completed_topics < 5:
            reasons.append("limited completed learning evidence")
        if skill.confidence < 60:
            reasons.append("low confidence signal")
        gaps.append({
            "skill": skill.name,
            "category": skill.category,
            "gap": gap,
            "priority": "high" if gap >= 45 else "medium",
            "recommendation": f"Practice {skill.name} through one focused mini-project and one interview drill.",
            "reasons": reasons or ["target role requires stronger proof"],
        })
    return sorted(gaps, key=lambda item: item["gap"], reverse=True)[:8]


def generate_career_projects(user, roadmap):
    blueprint = career_blueprint_for(roadmap.target_career)
    gaps = [item["skill"] for item in career_skill_gap(user, roadmap)[:4]]
    technologies = roadmap.preferred_technologies or blueprint["skills"][:4]
    created = []
    for index, title in enumerate(blueprint["projects"][:4], start=1):
        created.append(CareerProjectRecommendation.objects.create(
            user=user,
            roadmap=roadmap,
            title=title,
            difficulty=["easy", "medium", "medium", "hard"][min(index - 1, 3)],
            estimated_weeks=max(1, round(roadmap.timeline_weeks / 8) + index - 1),
            required_technologies=list(dict.fromkeys([*technologies[:4], *gaps[:2]]))[:6],
            architecture_suggestions=[
                "Define core user flows before coding.",
                "Use a small API/data layer instead of hardcoded screens.",
                "Add one measurable analytics or testing feature.",
            ],
            reason=f"Strengthens {format_topic_list((gaps or technologies)[:3])} for {roadmap.target_career}.",
        ))
    return created


def generate_career_readiness(user, roadmap=None):
    roadmap = roadmap or CareerRoadmap.objects.filter(user=user).first()
    if not roadmap:
        return None
    skills = list(roadmap.skills.all())
    avg_skill = sum(skill.current_level for skill in skills) / len(skills) if skills else 0
    completed_projects = roadmap.project_recommendations.filter(status="completed").count()
    project_count = roadmap.project_recommendations.count()
    portfolio = clamp((completed_projects / max(project_count, 1)) * 70 + min(project_count, 4) * 7)
    quiz_avg = ProgressLog.objects.filter(user=user).exclude(quiz_score=None).aggregate(avg=Avg("quiz_score")).get("avg") or avg_skill
    interview_sessions = roadmap.interview_sessions.count()
    interview_avg = roadmap.interview_sessions.aggregate(avg=Avg("score")).get("avg") or 0
    interview = clamp((quiz_avg * 0.55) + (interview_avg * 0.35) + min(interview_sessions * 5, 10))
    snapshot = CareerReadinessSnapshot.objects.create(
        user=user,
        roadmap=roadmap,
        career_readiness=clamp(avg_skill * 0.45 + portfolio * 0.30 + interview * 0.25),
        interview_readiness=interview,
        portfolio_strength=portfolio,
        technical_confidence=clamp(avg_skill),
        missing_requirements=[gap["skill"] for gap in career_skill_gap(user, roadmap)[:5]],
        improvement_trends=[
            "Portfolio score rises fastest when recommended projects are completed.",
            "Interview readiness improves through answer evaluation and weak-concept retries.",
            "Technical confidence is tied to skill mastery evidence, not time spent alone.",
        ],
    )
    return snapshot


def generate_career_insights(user, roadmap=None):
    roadmap = roadmap or CareerRoadmap.objects.filter(user=user).first()
    if not roadmap:
        return []
    gaps = career_skill_gap(user, roadmap)
    insights = []
    if gaps:
        top = gaps[0]
        insights.append(CareerLearningInsight.objects.create(
            user=user,
            roadmap=roadmap,
            title=f"{top['skill']} is your highest leverage gap",
            detail=f"Your {top['skill']} gap is {top['gap']} points. Pair a focused lesson with a small project proof this week.",
            severity="warning",
        ))
    insights.append(CareerLearningInsight.objects.create(
        user=user,
        roadmap=roadmap,
        title="Project evidence drives readiness",
        detail=f"{roadmap.target_career} readiness will improve fastest when you complete portfolio projects tied to weak skills.",
        severity="info",
    ))
    insights.append(CareerLearningInsight.objects.create(
        user=user,
        roadmap=roadmap,
        title="Learning path adjustment",
        detail="Keep fundamentals short and increase project time when weekly consistency and quiz scores stay stable.",
        severity="info",
    ))
    return insights


def career_dashboard_payload(user):
    roadmap = (
        CareerRoadmap.objects.filter(user=user)
        .prefetch_related("phases", "skills", "project_recommendations", "readiness_snapshots", "learning_insights", "interview_sessions")
        .first()
    )
    if not roadmap:
        return {"roadmap": None, "readiness": None, "skill_gaps": [], "projects": [], "insights": [], "interview_history": []}
    latest_readiness = roadmap.readiness_snapshots.first() or generate_career_readiness(user, roadmap)
    if roadmap.learning_insights.count() < 2:
        generate_career_insights(user, roadmap)
    return {
        "roadmap": roadmap,
        "readiness": latest_readiness,
        "skill_gaps": career_skill_gap(user, roadmap),
        "projects": roadmap.project_recommendations.all(),
        "insights": roadmap.learning_insights.all()[:6],
        "interview_history": roadmap.interview_sessions.all()[:6],
    }


def evaluate_career_interview(user, payload):
    roadmap = CareerRoadmap.objects.filter(user=user, id=payload.get("roadmap")).first() or CareerRoadmap.objects.filter(user=user).first()
    if not roadmap:
        raise ValueError("Create a career roadmap before starting interview preparation.")
    question = (payload.get("question") or f"Explain how your projects prove readiness for {roadmap.target_career}.").strip()
    answer = (payload.get("answer") or "").strip()
    answer_words = len(answer.split())
    weak_skills = [skill.name for skill in roadmap.skills.order_by("current_level")[:3]]
    score = clamp(35 + min(answer_words, 90) * 0.45 + (15 if any(skill.lower() in answer.lower() for skill in weak_skills) else 0))
    weak_concepts = [skill for skill in weak_skills if skill.lower() not in answer.lower()][:3]
    session = CareerInterviewSession.objects.create(
        user=user,
        roadmap=roadmap,
        interview_type=payload.get("interview_type") or "technical",
        question=question,
        answer=answer,
        evaluation=(
            f"Score: {score}%. Your answer is {'clear' if score >= 70 else 'promising but incomplete'}. "
            "Improve it by naming the problem, explaining trade-offs, and tying the result to measurable impact."
        ),
        score=score,
        weak_concepts=weak_concepts,
    )
    generate_career_readiness(user, roadmap)
    return session
