from django.urls import path
from .views import (
    ResourcesDashboardView,
    ResourceListView,
    RecommendedResourcesView,
    WeakTopicResourcesView,
)

urlpatterns = [
    path('', ResourceListView.as_view(), name='resource_list'),
    path('dashboard/', ResourcesDashboardView.as_view(), name='resources_dashboard'),
    path('recommended/', RecommendedResourcesView.as_view(), name='resources_recommended'),
    path('weak-topics/', WeakTopicResourcesView.as_view(), name='resources_weak_topics'),
]