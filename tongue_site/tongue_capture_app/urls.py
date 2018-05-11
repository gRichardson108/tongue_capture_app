from django.conf.urls import url
from django.urls import path

from . import views
app_name = 'tongue_capture_app'
urlpatterns = [
    url(r'^$', views.instructions, name='index'),
    url(r'^capture$', views.add_images, name='imagecapture'),
    url(r'^upload$', views.upload_images, name='upload'),
    url(r'^thankyou$', views.thanks_page, name='thankyou'),
]
