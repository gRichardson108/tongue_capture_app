from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.urls import reverse

from secrets import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET_NAME
import boto3
import json, base64

# Create your views here.
def add_images(request):
    return render(request, 'capture/add_images.html')

def upload_images(request):
    if request.method == 'POST':
        s3 = boto3.resource('s3', 
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        imageObject = s3.Object(BUCKET_NAME, 'up/test.png')

        imgUrl = json.loads(request.body)['imgUrl']
        # the save method prepends a header followed by a comma, then the data, so we strip it out first
        imgUrl = imgUrl.split(',')[1] 
        imageObject.put(Body=base64.b64decode(imgUrl),ContentType='image/png')
        return HttpResponse(status=204)
    else:
        return HttpResponseRedirect(reverse('tongue_capture_app:index'))