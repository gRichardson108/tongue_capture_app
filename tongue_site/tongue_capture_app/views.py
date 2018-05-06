from django.shortcuts import render

# Create your views here.
def add_images(request):
    return render(request, 'capture/add_images.html')