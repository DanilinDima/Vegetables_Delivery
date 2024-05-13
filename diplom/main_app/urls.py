from django.urls import path
from . import views

urlpatterns = [
    path("", views.user_login, name="login"),
    path("main.html", views.main_page, name="main_page"),
    path("submit-order/", views.submit_order, name="submit_order"),
    path("get-updated-data/", views.get_updated_data, name="get_updated_data"),
    path("singup/", views.user_singup, name="singup"),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.user_profile, name='profile'),
    path('submit-profile/', views.update_profile, name='update_profile'),
    path('get-order-details-updated-data/', views.fetch_order_details_data, name='update_order_details'),
    path('change-password/', views.change_password, name='change_password'),

    ]
