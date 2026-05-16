from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("planner", "0007_mentorconversation_mentormessage_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="CareerRoadmap",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_career", models.CharField(max_length=140)),
                ("skill_level", models.CharField(choices=[("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced")], default="beginner", max_length=24)),
                ("weekly_hours", models.PositiveSmallIntegerField(default=8)),
                ("timeline_weeks", models.PositiveSmallIntegerField(default=12)),
                ("preferred_technologies", models.JSONField(blank=True, default=list)),
                ("summary", models.TextField(blank=True)),
                ("revision_strategy", models.TextField(blank=True)),
                ("interview_path", models.TextField(blank=True)),
                ("adaptive_notes", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-updated_at"],
                "indexes": [
                    models.Index(fields=["user", "-updated_at"], name="planner_car_user_id_41241c_idx"),
                    models.Index(fields=["user", "target_career"], name="planner_car_user_id_2f6bb4_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="CareerRoadmapPhase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phase_type", models.CharField(choices=[("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced"), ("projects", "Project Building"), ("interview", "Interview Preparation")], max_length=24)),
                ("title", models.CharField(max_length=160)),
                ("order", models.PositiveSmallIntegerField(default=1)),
                ("estimated_weeks", models.PositiveSmallIntegerField(default=2)),
                ("topics", models.JSONField(blank=True, default=list)),
                ("learning_goals", models.JSONField(blank=True, default=list)),
                ("recommended_projects", models.JSONField(blank=True, default=list)),
                ("progress_percent", models.PositiveSmallIntegerField(default=0)),
                ("roadmap", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="phases", to="planner.careerroadmap")),
            ],
            options={
                "ordering": ["order"],
                "indexes": [models.Index(fields=["roadmap", "order"], name="planner_car_roadmap_b09a8c_idx")],
            },
        ),
        migrations.CreateModel(
            name="CareerProjectRecommendation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("difficulty", models.CharField(default="medium", max_length=24)),
                ("estimated_weeks", models.PositiveSmallIntegerField(default=2)),
                ("required_technologies", models.JSONField(blank=True, default=list)),
                ("architecture_suggestions", models.JSONField(blank=True, default=list)),
                ("reason", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("recommended", "Recommended"), ("in_progress", "In Progress"), ("completed", "Completed")], default="recommended", max_length=24)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("roadmap", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="project_recommendations", to="planner.careerroadmap")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["status", "difficulty", "title"],
                "indexes": [models.Index(fields=["user", "status"], name="planner_car_user_id_5ff727_idx")],
            },
        ),
        migrations.CreateModel(
            name="CareerReadinessSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("career_readiness", models.PositiveSmallIntegerField(default=0)),
                ("interview_readiness", models.PositiveSmallIntegerField(default=0)),
                ("portfolio_strength", models.PositiveSmallIntegerField(default=0)),
                ("technical_confidence", models.PositiveSmallIntegerField(default=0)),
                ("missing_requirements", models.JSONField(blank=True, default=list)),
                ("improvement_trends", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("roadmap", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="readiness_snapshots", to="planner.careerroadmap")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["user", "-created_at"], name="planner_car_user_id_770b83_idx")],
            },
        ),
        migrations.CreateModel(
            name="CareerLearningInsight",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("detail", models.TextField()),
                ("severity", models.CharField(choices=[("info", "Info"), ("warning", "Warning"), ("success", "Success")], default="info", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("roadmap", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="learning_insights", to="planner.careerroadmap")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["user", "-created_at"], name="planner_car_user_id_7c86f6_idx")],
            },
        ),
        migrations.CreateModel(
            name="CareerInterviewSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("interview_type", models.CharField(default="technical", max_length=40)),
                ("question", models.TextField()),
                ("answer", models.TextField(blank=True)),
                ("evaluation", models.TextField(blank=True)),
                ("score", models.PositiveSmallIntegerField(default=0)),
                ("weak_concepts", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("roadmap", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="interview_sessions", to="planner.careerroadmap")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["user", "-created_at"], name="planner_car_user_id_fb8ff8_idx")],
            },
        ),
        migrations.CreateModel(
            name="SkillProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("category", models.CharField(default="technical", max_length=80)),
                ("current_level", models.PositiveSmallIntegerField(default=30)),
                ("target_level", models.PositiveSmallIntegerField(default=80)),
                ("confidence", models.PositiveSmallIntegerField(default=50)),
                ("evidence", models.JSONField(blank=True, default=list)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("roadmap", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="skills", to="planner.careerroadmap")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["category", "name"],
                "unique_together": {("user", "roadmap", "name")},
                "indexes": [models.Index(fields=["user", "category"], name="planner_ski_user_id_f28caf_idx")],
            },
        ),
    ]
