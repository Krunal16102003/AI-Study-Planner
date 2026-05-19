from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=120, blank=True)
    avatar = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=160, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=40, blank=True)
    timezone = models.CharField(max_length=80, blank=True)
    language = models.CharField(max_length=160, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    portfolio = models.URLField(blank=True)
    experience_level = models.CharField(max_length=80, blank=True)
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    primary_skills = models.TextField(blank=True)
    secondary_skills = models.TextField(blank=True)
    preferred_role = models.CharField(max_length=120, blank=True)
    tech_stack = models.TextField(blank=True)
    resume = models.CharField(max_length=255, blank=True)
    current_company = models.CharField(max_length=160, blank=True)
    preferred_job_type = models.CharField(max_length=80, blank=True)
    career_goal = models.CharField(max_length=160, blank=True)
    daily_study_hours = models.DecimalField(max_digits=4, decimal_places=1, default=2)
    target_exam = models.CharField(max_length=120, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name or self.user.username
