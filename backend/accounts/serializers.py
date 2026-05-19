from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "confirm_password", "full_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        if User.objects.filter(email__iexact=attrs.get("email", "")).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        validated_data.pop("confirm_password", None)
        user = User.objects.create_user(**validated_data)
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.full_name = full_name
        profile.daily_study_hours = 2
        profile.save(update_fields=["full_name", "daily_study_hours", "updated_at"])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    joined_at = serializers.DateTimeField(source="user.date_joined", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "joined_at",
            "full_name",
            "avatar",
            "bio",
            "location",
            "phone",
            "date_of_birth",
            "gender",
            "timezone",
            "language",
            "github",
            "linkedin",
            "portfolio",
            "experience_level",
            "years_of_experience",
            "primary_skills",
            "secondary_skills",
            "preferred_role",
            "tech_stack",
            "resume",
            "current_company",
            "preferred_job_type",
            "career_goal",
            "daily_study_hours",
            "target_exam",
            "updated_at",
            "created_at",
        ]
        read_only_fields = ["id", "user_id", "username", "email", "joined_at", "created_at", "updated_at"]
