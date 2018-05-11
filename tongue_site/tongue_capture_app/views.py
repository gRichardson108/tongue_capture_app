from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.urls import reverse

from secrets import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET_NAME
import boto3
import json, base64
import uuid

# Create your views here.
def instructions(request):
    assign_uid(request)
    return render(request, 'capture/instructions.html')

def add_images(request):
    assign_uid(request)
    return render(request, 'capture/add_images.html')

def upload_images(request):
    assign_uid(request)
    if request.method == 'POST':
        directory = json.loads(request.body)['direction']
        if (directory not in ('up', 'down', 'left', 'right', 'test', 'up')):
            return HttpResponse(status=403)

        s3 = boto3.resource('s3', 
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )

        imgUrls = json.loads(request.body)['imgUrls']
        # the save method prepends a header followed by a comma, then the data, so we strip it out first
        images = [base64.b64decode(imgUrl.split(',')[1]) for imgUrl in imgUrls]

        metadata = json.loads(request.body)['metadata']
        metadata['sessionkey'] = request.session['imagekey']
        uid = str(uuid.uuid4())
        for i,im in enumerate(images):
            imageObject = s3.Object(BUCKET_NAME, '{0}/{1}[{2}].png'.format(directory, uid, i))
            imageObject.put(Body=im,ContentType='image/png')
        imageMetadata = s3.Object(BUCKET_NAME, '{0}/{1}.json'.format(directory, uid))
        imageMetadata.put(Body=json.dumps(metadata),ContentType='text/json')
        return HttpResponse(status=204)
    else:
        return HttpResponseRedirect(reverse('tongue_capture_app:index'))

def thanks_page(request):
    if 'imagekey' in request.session:
        return render(request, 'capture/thankyou.html', {'imagekey' : request.session['imagekey']})
    else:
        return HttpResponseRedirect(reverse('tongue_capture_app:index'))

def assign_uid(request):
    if 'imagekey' not in request.session:
        request.session['imagekey'] = str(uuid.uuid4())