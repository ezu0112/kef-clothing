from django.urls import path
from django.contrib.auth import views as auth_views

from . import views


urlpatterns = [
    path("", views.home, name="home"),

    path("products/", views.products, name="products"),

    path(
        "products/<int:product_id>/",
        views.product_detail,
        name="product_detail"
    ),

    path("videos/", views.videos, name="videos"),
    path("articles/", views.articles, name="articles"),
    path("about/", views.about, name="about"),

    path(
        "api/search/",
        views.search_products,
        name="search_products"
    ),

    path("shopping-cart/", views.cart, name="cart"),

    path(
        "accounts/login/",
        auth_views.LoginView.as_view(
            template_name="shop/login.html",
            next_page="account",
            redirect_authenticated_user=True,
            extra_context={"hide_banner": True}
        ),
        name="login"
    ),

    path(
        "accounts/logout/",
        auth_views.LogoutView.as_view(next_page="home"),
        name="logout"
    ),

    path(
        "accounts/register/",
        views.register,
        name="register"
    ),

    path("accounts/", views.account, name="account"),

    path("checkout/", views.checkout, name="checkout"),

    path("faq/", views.faq, name="faq"),
]