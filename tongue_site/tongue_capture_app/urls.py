from django.conf.urls import url
from django.urls import path

from . import views
app_name = 'tongue_capture_app'
urlpatterns = [
    url(r'^$', views.add_images, name='index'),
]
