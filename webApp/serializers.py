from rest_framework import serializers
from .models import Web_Data, ASV_Data


class Web_Data_Serializer(serializers.ModelSerializer):
    class Meta:
        model = Web_Data
        fields = '__all__'


class ASV_Data_Serializer(serializers.ModelSerializer):
    class Meta:
        model = ASV_Data
        fields = '__all__'
