from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# TODO: complete the function below such that it uses Response to return the status "ok"
@api_view(['GET'])
def health(request):
    return Response({"status": "ok"}, status = 200)