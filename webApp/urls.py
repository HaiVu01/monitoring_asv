from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="dashboard-index"),
    path('mapSelection/', views.mapSelection, name='dashboard-mapSelection'),
    path('mapChecking/', views.mapChecking, name='dashboard-mapChecking'),
    path('monitoring/', views.monitoring, name='dashboard-monitoring'),

    path('asv-data/', views.ASVDataView.as_view(), name='asv-data'),

    path('get_latest_sensor_data/', views.get_latest_sensor_data,
         name='get_latest_sensor_data'),
    path('get_location_ASV/', views.get_location_ASV,
         name='get_location_ASV'),
    path('get_points_web/', views.get_points_web,
         name='get_points_web'),
    path('get_distances/', views.get_distances,
         name='get_distances'),

]
