from math import radians, cos, sin, asin, sqrt
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
import json
from decimal import Decimal
from .serializers import Web_Data_Serializer, ASV_Data_Serializer
from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.hashers import check_password
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from django.shortcuts import render
from .models import ASV_Data, Web_Data
from .serializers import ASV_Data_Serializer, Web_Data_Serializer


class ASVDataView(APIView):
    def get(self, request):
        data = ASV_Data.objects.all()
        serializer = ASV_Data_Serializer(data, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ASV_Data_Serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_latest_sensor_data(request):
    latest_data = ASV_Data.objects.latest('created_at')
    data = {
        "temperature": latest_data.temperature,
        "humidity": latest_data.humidity,
        "dissolvedOxygen": latest_data.dissolvedOxygen,
        "pressure": latest_data.airPressure,
    }
    return JsonResponse(data)


def index(request):
    return render(request, 'dashboard/index.html')


def monitoring(request):
    return render(request, 'dashboard/monitoring.html')


@csrf_exempt
def mapSelection(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        Web_Data.objects.all().delete()

        for item in data:
            Web_Data.objects.create(
                zone=item['zone'],
                latitude=item['latitude'],
                longitude=item['longitude']
            )

        return JsonResponse({'status': 'success'})

    existing_data = Web_Data.objects.all()
    existing_data_json = serializers.serialize("json", existing_data)

    return render(request, 'dashboard/mapSelection.html', {'points_json': existing_data_json})


@csrf_exempt
def mapChecking(request):
    return render(request, 'dashboard/mapChecking.html')


def get_location_ASV(request):
    latest_location = ASV_Data.objects.order_by('-created_at').first()
    data = {
        "humidity": latest_location.humidity,
        "temperature": latest_location.temperature,
        "dissolvedOxygen": latest_location.dissolvedOxygen,
        "airPressure": latest_location.airPressure,
        "latitude": latest_location.latitude,
        "longitude": latest_location.longitude,
        "created_at": latest_location.created_at,
    }
    return JsonResponse(data)


def get_points_web(request):
    data = Web_Data.objects.all()
    serializer = Web_Data_Serializer(data, many=True)
    coordinate_pairs = []

    for item in serializer.data:
        coordinate_pairs.append(f"{item['latitude']},{item['longitude']}")

    coordinates_str = "/".join(coordinate_pairs)
    return JsonResponse({'coordinates': coordinates_str}, safe=False)


def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    # Radius of earth in kilometers. Use 3956 for miles. Determines return value units.
    r = 6371
    return c * r * 1000  # convert to meters


def get_latest_asv_data():
    latest_location = ASV_Data.objects.order_by('-created_at').first()
    data = {
        "humidity": latest_location.humidity,
        "temperature": latest_location.temperature,
        "dissolvedOxygen": latest_location.dissolvedOxygen,
        "airPressure": latest_location.airPressure,
        "latitude": latest_location.latitude,
        "longitude": latest_location.longitude,
        "created_at": latest_location.created_at,
    }
    return data


def get_location_ASV(request):
    data = get_latest_asv_data()
    return JsonResponse(data)


def get_distances(request):
    asv_data = get_latest_asv_data()
    web_data = Web_Data.objects.all()
    serializer = Web_Data_Serializer(web_data, many=True)

    distances = []

    for item in serializer.data:
        dist = haversine(float(asv_data['longitude']), float(
            asv_data['latitude']), float(item['longitude']), float(item['latitude']))
        distances.append(dist)

    return JsonResponse({'distances': distances}, safe=False)
