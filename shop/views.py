from django.shortcuts import render
from django.http import Http404
from django.http import JsonResponse
from django.templatetags.static import static
from django.urls import reverse
from django.shortcuts import redirect
from django.contrib.auth import login as auth_login
from django.contrib.auth.forms import UserCreationForm

# НҮҮР ХУУДАС
def home(request):
    return render(request, "shop/home.html")


# БИЧЛЭГ
def videos(request):
    return render(request, "shop/videos.html")


# НИЙТЛЭЛ
def articles(request):
    return render(request, "shop/articles.html")


# БИДНИЙ ТУХАЙ
def about(request):
    return render(request, "shop/about.html")


# БАРААНЫ НЭГДСЭН МЭДЭЭЛЭЛ
def get_catalog():
    # Нэр, үнэ, зургийн нэр, ангилал,
    # дууссан, онцлох, бестселлер, хуучин үнэ
    product_data = [
        (
            "Off shoulder top", 60000, "suuld1",
            "top", False, False, False, 0
        ),
        (
            "Off shoulder top", 60000, "suuld2",
            "top", False, False, False, 0
        ),
        (
            "One shoulder top", 60000, "suuld3",
            "top", False, True, False, 0
        ),
        (
            "One shoulder top", 60000, "suuld4",
            "top", False, False, False, 0
        ),
        (
            "One shoulder top", 60000, "suuld5",
            "top", False, False, False, 0
        ),
        (
            "Cute off shoulder top", 60000, "suuld6",
            "top", False, True, False, 0
        ),
        (
            "Cute off shoulder top", 60000, "suuld7",
            "top", False, True, False, 0
        ),
        (
            "Cute off shoulder top", 60000, "suuld8",
            "top", False, True, False, 0
        ),
        (
            "Cute off shoulder top", 60000, "ontsloh5",
            "top", False, True, False, 0
        ),
        (
            "BASIC ZIPPED TOP /хар/", 65000, "baraa10",
            "basics", True, False, False, 0
        ),
        (
            "BASIC ZIPPED TOP /хөх/", 65000, "baraa11",
            "basics", False, False, True, 0
        ),
        (
            "S BASIC LONG SLEEVE TOP /хар/", 55000, "baraa12",
            "basics", True, False, False, 0
        ),
        (
            "S BASIC LONG SLEEVE TOP", 55000, "baraa13",
            "basics", True, False, False, 0
        ),
        (
            "S BASIC LONG SLEEVE TOP /хөх/", 55000, "ontsloh6",
            "basics", True, True, False, 0
        ),
        (
            "S BASIC MIDI SLEEVE TOP /хар/", 55000, "baraa15",
            "basics", False, False, True, 0
        ),
        (
            "S BASIC MIDI SLEEVE TOP", 55000, "baraa16",
            "basics", False, False, False, 0
        ),
        (
            "S BASIC TEE", 50000, "ontsloh7",
            "basics", False, True, False, 0
        ),
        (
            "S BASIC TEE", 50000, "ontsloh8",
            "basics", False, True, False, 0
        ),
        (
            "Puff sleeve square neck top", 38500, "hymdral1",
            "top", False, False, False, 55000
        ),
        (
            "Puff sleeve square neck top", 38500, "hymdral2",
            "top", False, False, False, 55000
        ),
        (
            "Lace midi dress", 55000, "hymdral3",
            "dress", False, False, False, 110000
        ),
        (
            "Midi sleeve polo shirt", 52500, "hymdral4",
            "shirt", False, False, False, 75000
        ),
        (
            "Midi sleeve polo shirt", 52500, "hymdral5",
            "shirt", False, False, False, 75000
        ),
        (
            "Midi sleeve polo shirt", 52500, "hymdral6",
            "shirt", False, False, False, 75000
        ),
        (
            "Short leather jacket", 132300, "hymdral7",
            "jacket", False, False, False, 189000
        ),
        (
            "Long leather jacket", 146300, "hymdral8",
            "jacket", False, False, False, 209000
        ),
    ]

    categories = [
        ("", "Бүгд"),
        ("outlet", "Outlet"),
        ("pants", "Pants"),
        ("sweatshirt", "Sweatshirt"),
        ("gift-box", "Gift Box"),
        ("basics", "BASICS by Kef"),
        ("shirt", "Shirt"),
        ("skirt", "Skirt"),
        ("jacket", "Bomber & Jacket"),
        ("gift-card", "Gift Card"),
        ("top", "Top"),
        ("dress", "Dress"),
        ("bodysuit", "Bodysuit"),
    ]

    items = []

    for index, data in enumerate(product_data, start=1):
        (
            name,
            price,
            image_name,
            category,
            sold_out,
            featured,
            bestseller,
            old_price,
        ) = data

        # suuld1 -> suuld1-1
        # baraa10 -> baraa10-10
        number = "".join(
            character
            for character in image_name
            if character.isdigit()
        )

        discount = 0

        if old_price:
            discount = round(
                (old_price - price) / old_price * 100
            )

        items.append({
            "id": index,
            "name": name,
            "price": price,
            "price_text": f"{price:,}₮",
            "old_price": old_price,
            "old_price_text": f"{old_price:,}₮",
            "discount": discount,
            "image": f"shop/images/{image_name}.jpg",
            "hover_image": (
                f"shop/images/{image_name}-{number}.jpg"
            ),
            "category": category,
            "sold_out": sold_out,
            "featured": featured,
            "bestseller": bestseller,
        })

    return items, categories


# БҮТЭЭГДЭХҮҮНИЙ ЖАГСААЛТ
def products(request):
    items, categories = get_catalog()

    query = request.GET.get("q", "").strip()
    category = request.GET.get("category", "")
    sort = request.GET.get("sort", "newest")

    sale_only = request.GET.get("sale") == "1"
    featured_only = request.GET.get("featured") == "1"
    bestseller_only = request.GET.get("bestseller") == "1"

    # Ангиллын утгыг шалгах
    valid_categories = {
        value for value, label in categories
    }

    if category not in valid_categories:
        category = ""

    # Ангиллаар шүүх
    if category == "outlet":
        items = [
            item for item in items
            if item["old_price"]
        ]
    elif category:
        items = [
            item for item in items
            if item["category"] == category
        ]

    # Нэрээр хайх
    if query:
        items = [
            item for item in items
            if query.casefold() in item["name"].casefold()
        ]

    # Хямдралтай
    if sale_only:
        items = [
            item for item in items
            if item["old_price"]
        ]

    # Онцлох
    if featured_only:
        items = [
            item for item in items
            if item["featured"]
        ]

    # Бестселлер
    if bestseller_only:
        items = [
            item for item in items
            if item["bestseller"]
        ]

    # Жагсаалтын үндсэн дарааллыг шинэ нь эхэнд гэж ашиглана
    if sort == "oldest":
        items.sort(
            key=lambda item: item["id"],
            reverse=True
        )

    elif sort == "az":
        items.sort(
            key=lambda item: item["name"].casefold()
        )

    elif sort == "za":
        items.sort(
            key=lambda item: item["name"].casefold(),
            reverse=True
        )

    elif sort == "price_asc":
        items.sort(
            key=lambda item: item["price"]
        )

    elif sort == "price_desc":
        items.sort(
            key=lambda item: item["price"],
            reverse=True
        )

    category_name = dict(categories).get(category, "Бүгд")

    if category:
        page_heading = category_name
    else:
        page_heading = "Бүх бүтээгдэхүүн"

    # Ангилал солиход бусад шүүлтүүрийг хадгалах
    category_links = []

    for value, label in categories:
        params = request.GET.copy()
        params["category"] = value
        params.pop("page", None)

        category_links.append({
            "label": label,
            "url": "?" + params.urlencode(),
            "active": value == category,
        })

    return render(request, "shop/products.html", {
        "products": items,
        "category_links": category_links,
        "category": category,
        "page_heading": page_heading,
        "query": query,
        "sort": sort,
        "sale_only": sale_only,
        "featured_only": featured_only,
        "bestseller_only": bestseller_only,
    })


# БАРААНЫ ДЭЛГЭРЭНГҮЙ
def product_detail(request, product_id):
    items, categories = get_catalog()

    product = next(
        (
            item for item in items
            if item["id"] == product_id
        ),
        None
    )

    if product is None:
        raise Http404("Бараа олдсонгүй.")

    # Одоогоор сонгож болох жишиг хэмжээнүүд
    sizes = ["XS", "S", "M", "L", "XL"]

    is_polo = "polo shirt" in product["name"].lower()

    if is_polo:
        sizes = ["S", "M", "L"]

    # Одоогийн бараанаас бусад бараа
    others = [
        item for item in items
        if item["id"] != product_id
    ]

    # Ижил ангиллын бараанууд
    same_category = [
        item for item in others
        if item["category"] == product["category"]
    ]

    # Бусад ангиллын бараанууд
    other_categories = [
        item for item in others
        if item["category"] != product["category"]
    ]

    # Endless slider-т харуулах 8 бараа
    related_products = (
        same_category + other_categories
    )[:8]

    return render(request, "shop/product_detail.html", {
        "product": product,
        "sizes": sizes,
        "is_polo": is_polo,
        "related_products": related_products,
        "is_product_detail": True,
    })


# HEADER-ИЙН ШУУД ХАЙЛТ
def search_products(request):
    query = request.GET.get("q", "").strip().casefold()
    items, categories = get_catalog()

    matches = []

    if query:
        for item in items:
            if query in item["name"].casefold():
                matches.append({
                    "name": item["name"],
                    "price": item["price_text"],
                    "image": static(item["image"]),
                    "url": reverse(
                        "product_detail",
                        args=[item["id"]]
                    ),
                })

    return JsonResponse({
        "products": matches[:6],
    })


# САГСНЫ ХУУДАС
def cart(request):
    return render(request, "shop/cart.html", {
        "hide_banner": True,
    })


# БҮРТГҮҮЛЭХ
def register(request):
    if request.user.is_authenticated:
        return redirect("account")

    if request.method == "POST":
        form = UserCreationForm(request.POST)

        if form.is_valid():
            user = form.save()
            auth_login(
                request,
                user,
                backend="django.contrib.auth.backends.ModelBackend"
            )
            return redirect("account")
    else:
        form = UserCreationForm()

    form.fields["username"].label = "Нэвтрэх нэр"
    form.fields["password1"].label = "Нууц үг"
    form.fields["password2"].label = "Нууц үг давтах"

    return render(request, "shop/register.html", {
        "form": form,
        "hide_banner": True,
    })


# ХЭРЭГЛЭГЧИЙН ХЭСЭГ
def account(request):
    if not request.user.is_authenticated:
        return redirect("login")

    return render(request, "shop/account.html", {
        "hide_banner": True,
    })


def checkout(request):
    return render(request, "shop/checkout.html", {
        "hide_banner": True,
    })

def faq(request):
    return render(request, "shop/faq.html", {
        "hide_banner": True,
    })