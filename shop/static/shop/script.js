"use strict";

/* ==================================================
   ШУУД ЗАХИАЛАХ
================================================== */

document.addEventListener("click", (event) => {
    const button = event.target.closest("#buyNowButton");

    if (!button || button.disabled) return;

    event.preventDefault();

    const addButton = document.getElementById("addToCartButton");
    const sizeInput = document.querySelector(
        'input[name="product_size"]:checked'
    );
    const quantityInput = document.getElementById("productQuantity");

    if (!addButton || !sizeInput) {
        alert("Барааны мэдээлэл болон хэмжээгээ шалгана уу.");
        return;
    }

    const product = {
        id: Number(addButton.dataset.id),
        name: addButton.dataset.name,
        price: Number(addButton.dataset.price),
        image: addButton.dataset.image,
        size: sizeInput.value,
        sizes: [...document.querySelectorAll(
            'input[name="product_size"]'
        )].map((input) => input.value),
        quantity: Math.min(
            99,
            Math.max(1, parseInt(quantityInput?.value, 10) || 1)
        )
    };

    if (
        !Number.isInteger(product.id) ||
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price < 0
    ) {
        alert("Барааны ID, нэр, үнийн мэдээлэл дутуу байна.");
        return;
    }

    try {
        sessionStorage.setItem("kef_buy_now", JSON.stringify([product]));
    } catch {
        alert("Захиалгын мэдээллийг хадгалж чадсангүй.");
        return;
    }

    window.location.assign(
        button.dataset.checkoutUrl || "/checkout/?buy_now=1"
    );
}, true);


/* ==================================================
   ХУУДАС БЭЛЭН БОЛОХОД
================================================== */

function initializeShop() {
    const money = (value) =>
        Number(value).toLocaleString("en-US") + "₮";

    const clampQuantity = (value) =>
        Math.min(99, Math.max(1, parseInt(value, 10) || 1));

    function readItems(storage, key) {
        try {
            const items = JSON.parse(storage.getItem(key) || "[]");

            if (!Array.isArray(items)) return [];

            return items.filter((item) => (
                item &&
                Number.isInteger(item.id) &&
                typeof item.name === "string" &&
                typeof item.size === "string" &&
                Number.isFinite(item.price) &&
                item.price >= 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity >= 1 &&
                item.quantity <= 99
            ));
        } catch {
            return [];
        }
    }


    /* ==============================================
       ENDLESS SLIDER — 5 ЦЭГ
    ============================================== */

    document.querySelectorAll(".featured-section").forEach((section) => {
        const slider = section.querySelector(".featured-slider");
        const dots = section.querySelector(".slider-dots");

        if (!slider || !dots) return;

        const cards = [...slider.children];
        const count = cards.length;

        if (!count) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        let step = 0;
        let cycle = 0;
        let frame = 0;
        let moving = false;
        let hovered = false;
        let pauseUntil = 0;
        let scrollTimer;

        function cloneCard(card) {
            const clone = card.cloneNode(true);

            clone.setAttribute("aria-hidden", "true");
            clone.tabIndex = -1;

            clone.querySelectorAll(
                "a, button, input, select, textarea, [tabindex]"
            ).forEach((element) => {
                element.tabIndex = -1;
            });

            return clone;
        }

        const before = document.createDocumentFragment();
        const after = document.createDocumentFragment();

        cards.forEach((card) => {
            before.append(cloneCard(card));
            after.append(cloneCard(card));
        });

        slider.prepend(before);
        slider.append(after);

        function logicalIndex() {
            if (!step) return 0;

            const index = Math.round(
                (slider.scrollLeft - cycle) / step
            );

            return ((index % count) + count) % count;
        }

        function updateDots() {
            const activeIndex = Math.min(
                4,
                Math.floor(logicalIndex() * 5 / count)
            );

            [...dots.children].forEach((dot, index) => {
                const active = index === activeIndex;

                dot.classList.toggle("active", active);
                dot.setAttribute("aria-pressed", String(active));
            });
        }

        function normalize() {
            if (!cycle) return;

            let position = slider.scrollLeft;

            while (position < cycle) position += cycle;
            while (position >= cycle * 2) position -= cycle;

            if (Math.abs(position - slider.scrollLeft) > 0.5) {
                slider.scrollLeft = position;
            }
        }

        function stopAnimation() {
            cancelAnimationFrame(frame);
            moving = false;
            pauseUntil = Date.now() + 5000;
        }

        function animateTo(target) {
            cancelAnimationFrame(frame);

            const start = slider.scrollLeft;
            const distance = target - start;

            if (reducedMotion.matches || Math.abs(distance) < 1) {
                moving = false;
                slider.scrollLeft = target;
                normalize();
                updateDots();
                return;
            }

            moving = true;
            const started = performance.now();

            function tick(now) {
                const progress = Math.min((now - started) / 500, 1);
                const eased = 1 - Math.pow(1 - progress, 3);

                slider.scrollLeft = start + distance * eased;

                if (progress < 1) {
                    frame = requestAnimationFrame(tick);
                } else {
                    moving = false;
                    normalize();
                    updateDots();
                }
            }

            frame = requestAnimationFrame(tick);
        }

        function measure() {
            const index = step ? logicalIndex() : 0;

            cancelAnimationFrame(frame);
            moving = false;

            const gap = parseFloat(
                getComputedStyle(slider).columnGap
            ) || 0;

            step = cards[0].getBoundingClientRect().width + gap;
            cycle = step * count;

            slider.scrollLeft = cycle + index * step;
            updateDots();
        }

        dots.replaceChildren();

        for (let i = 0; i < 5; i++) {
            const targetIndex = Math.ceil(i * count / 5);
            const dot = document.createElement("button");

            dot.type = "button";
            dot.className = "slider-dot";
            dot.setAttribute(
                "aria-label",
                `${i + 1}-р байрлал руу шилжих`
            );

            dot.addEventListener("click", () => {
                stopAnimation();
                normalize();

                const current = logicalIndex();
                let difference = targetIndex - current;

                if (difference > count / 2) difference -= count;
                if (difference < -count / 2) difference += count;

                animateTo(cycle + (current + difference) * step);
            });

            dots.append(dot);
        }

        slider.addEventListener("scroll", () => {
            updateDots();

            if (moving) return;

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                if (!moving) {
                    normalize();
                    updateDots();
                }
            }, 120);
        }, { passive: true });

        slider.addEventListener("pointerdown", stopAnimation);
        slider.addEventListener("wheel", stopAnimation, {
            passive: true
        });

        section.addEventListener("mouseenter", () => {
            hovered = true;
        });

        section.addEventListener("mouseleave", () => {
            hovered = false;
            pauseUntil = Date.now() + 3000;
        });

        slider.addEventListener("keydown", (event) => {
            if (event.target !== slider) return;

            const direction =
                event.key === "ArrowRight" ? 1 :
                event.key === "ArrowLeft" ? -1 : 0;

            if (!direction) return;

            event.preventDefault();
            stopAnimation();
            normalize();

            animateTo(
                cycle + (logicalIndex() + direction) * step
            );
        });

        setInterval(() => {
            if (
                moving ||
                hovered ||
                document.hidden ||
                reducedMotion.matches ||
                Date.now() < pauseUntil ||
                section.contains(document.activeElement) ||
                !step
            ) return;

            normalize();
            animateTo(cycle + (logicalIndex() + 1) * step);
        }, 3000);

        if ("ResizeObserver" in window) {
            new ResizeObserver(measure).observe(slider);
        } else {
            window.addEventListener("resize", measure);
        }

        measure();
    });


    /* ==============================================
       СҮҮЛД НЭМЭГДСЭН
    ============================================== */

    const loadMoreButton = document.getElementById("loadMoreButton");
    const latestGrid = document.getElementById("latestGrid");

    if (loadMoreButton && latestGrid) {
        loadMoreButton.addEventListener("click", () => {
            const nextCards = [
                ...latestGrid.querySelectorAll(".product-card[hidden]")
            ].slice(0, 4);

            nextCards.forEach((card) => {
                card.hidden = false;
            });

            loadMoreButton.setAttribute("aria-expanded", "true");

            if (!latestGrid.querySelector(".product-card[hidden]")) {
                const wrapper = loadMoreButton.closest(".load-more-wrap");

                if (wrapper) wrapper.hidden = true;
                else loadMoreButton.hidden = true;
            }
        });
    }


    /* ==============================================
       АНГИЛАЛ, ЭРЭМБЭ
    ============================================== */

    const filterForm = document.getElementById("productFilterForm");

    filterForm?.querySelectorAll('input[type="checkbox"]').forEach(
        (checkbox) => {
            checkbox.addEventListener("change", () => {
                filterForm.requestSubmit();
            });
        }
    );

    const searchForm = document.getElementById("productSearchForm");

    searchForm?.querySelector('select[name="sort"]')?.addEventListener(
        "change",
        () => searchForm.requestSubmit()
    );


    /* ==============================================
       БАРААНЫ ЗУРАГ, ТОО ШИРХЭГ
    ============================================== */

    const mainImage = document.getElementById("detailMainImage");
    const thumbnails = document.querySelectorAll(".detail-thumbnail");

    if (mainImage) {
        thumbnails.forEach((button) => {
            button.addEventListener("click", () => {
                mainImage.src = button.dataset.image;

                thumbnails.forEach((thumbnail) => {
                    const active = thumbnail === button;

                    thumbnail.classList.toggle("active", active);
                    thumbnail.setAttribute("aria-pressed", String(active));
                });
            });
        });
    }

    const quantityInput = document.getElementById("productQuantity");

    if (quantityInput) {
        document.getElementById("quantityMinus")?.addEventListener(
            "click",
            () => {
                quantityInput.value = Math.max(
                    1,
                    clampQuantity(quantityInput.value) - 1
                );
            }
        );

        document.getElementById("quantityPlus")?.addEventListener(
            "click",
            () => {
                quantityInput.value = Math.min(
                    99,
                    clampQuantity(quantityInput.value) + 1
                );
            }
        );

        quantityInput.addEventListener("change", () => {
            quantityInput.value = clampQuantity(quantityInput.value);
        });
    }


    /* ==============================================
       HEADER ХАЙЛТ
    ============================================== */

    (() => {
        const dialog = document.getElementById("searchDialog");
        const openButton = document.getElementById("openSearch");
        const input = document.getElementById("headerSearchInput");
        const results = document.getElementById("headerSearchResults");
        const allLink = document.getElementById("searchAllLink");

        if (!dialog || !openButton || !input || !results || !allLink) {
            return;
        }

        let timer;
        let controller;
        let version = 0;

        openButton.addEventListener("click", () => {
            if (!dialog.open) dialog.showModal();
            input.focus();
        });

        document.getElementById("closeSearch")?.addEventListener(
            "click",
            () => dialog.close()
        );

        dialog.addEventListener("click", (event) => {
            if (event.target !== dialog) return;

            const rect = dialog.getBoundingClientRect();

            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            ) {
                dialog.close();
            }
        });

        function showMessage(text) {
            const message = document.createElement("p");

            message.className = "search-result-message";
            message.textContent = text;

            results.replaceChildren(message);
            results.hidden = false;
        }

        input.addEventListener("input", () => {
            clearTimeout(timer);
            controller?.abort();

            const currentVersion = ++version;
            const query = input.value.trim();

            results.replaceChildren();
            results.hidden = !query;
            allLink.hidden = !query;

            const allUrl = new URL(allLink.href, location.origin);
            allUrl.searchParams.set("q", query);
            allLink.href = allUrl.href;

            if (!query) return;

            showMessage("Хайж байна...");

            timer = setTimeout(async () => {
                controller = new AbortController();

                try {
                    const url = new URL(
                        input.dataset.searchUrl,
                        location.origin
                    );

                    url.searchParams.set("q", query);

                    const response = await fetch(url, {
                        signal: controller.signal
                    });

                    if (!response.ok) throw new Error("Search failed");

                    const data = await response.json();

                    if (currentVersion !== version) return;

                    results.replaceChildren();

                    if (!data.products?.length) {
                        showMessage("Бараа олдсонгүй.");
                        return;
                    }

                    data.products.forEach((product) => {
                        const link = document.createElement("a");
                        link.className = "search-result-row";
                        link.href = product.url;

                        const image = document.createElement("img");
                        image.src = product.image;
                        image.alt = "";

                        const name = document.createElement("span");
                        name.className = "search-result-name";
                        name.textContent = product.name;

                        const price = document.createElement("strong");
                        price.className = "search-result-price";
                        price.textContent = product.price;

                        link.append(image, name, price);
                        results.append(link);
                    });
                } catch (error) {
                    if (
                        error.name !== "AbortError" &&
                        currentVersion === version
                    ) {
                        showMessage(
                            "Хайлт ачаалсангүй. Бүх үр дүнг харах дээр дарна уу."
                        );
                    }
                }
            }, 250);
        });
    })();


    /* ==============================================
       САГС
    ============================================== */

    (() => {
        const storageKey = "kef_shop_cart_v1";

        const cartButton = document.getElementById("openCart");
        const miniCart = document.getElementById("miniCart");
        const miniItems = document.getElementById("miniCartItems");
        const pageItems = document.getElementById("cartPageItems");
        const addButton = document.getElementById("addToCartButton");
        const toast = document.getElementById("cartToast");

        let basket = readItems(localStorage, storageKey);
        let toastTimer;

        function showToast(message) {
            if (!toast) return;

            clearTimeout(toastTimer);
            toast.textContent = message;
            toast.hidden = false;

            toastTimer = setTimeout(() => {
                toast.hidden = true;
            }, 2500);
        }

        function setCartOpen(open) {
            if (!miniCart || !cartButton) return;

            miniCart.hidden = !open;
            cartButton.setAttribute("aria-expanded", String(open));
        }

        function saveBasket() {
            const wasOpen = miniCart ? !miniCart.hidden : false;
            const scrollTop = miniItems?.scrollTop || 0;

            try {
                localStorage.setItem(storageKey, JSON.stringify(basket));
            } catch {
                showToast("Сагсыг browser-д хадгалж чадсангүй.");
            }

            renderBasket();
            setCartOpen(wasOpen);

            if (miniItems) miniItems.scrollTop = scrollTop;
        }

        function findItem(id, size) {
            return basket.find(
                (item) => item.id === id && item.size === size
            );
        }

        function removeItem(id, size) {
            basket = basket.filter(
                (item) => !(item.id === id && item.size === size)
            );

            saveBasket();
        }

        function changeQuantity(id, size, difference) {
            const item = findItem(id, size);

            if (!item) return;

            const nextQuantity = item.quantity + difference;

            if (nextQuantity <= 0) {
                removeItem(id, size);
                return;
            }

            item.quantity = Math.min(99, nextQuantity);
            saveBasket();
        }

        function changeSize(id, oldSize, newSize) {
            const item = findItem(id, oldSize);

            if (!item || !(item.sizes || [item.size]).includes(newSize)) {
                return;
            }

            const existing = findItem(id, newSize);

            if (existing && existing !== item) {
                existing.quantity = Math.min(
                    99,
                    existing.quantity + item.quantity
                );

                basket = basket.filter((row) => row !== item);
            } else {
                item.size = newSize;
            }

            saveBasket();
        }

        function quantityButton(text, label, action) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = text;
            button.setAttribute("aria-label", label);

            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                action();
            });

            return button;
        }

        function makeItemRow(item) {
            const row = document.createElement("article");
            row.className = "basket-item";

            const imageLink = document.createElement("a");
            imageLink.href = `/products/${item.id}/`;
            imageLink.setAttribute("aria-label", item.name);

            const image = document.createElement("img");
            image.className = "basket-item-image";
            image.alt = item.name;

            if (item.image) image.src = item.image;

            imageLink.append(image);

            const info = document.createElement("div");
            info.className = "basket-item-info";

            const name = document.createElement("a");
            name.className = "basket-item-name";
            name.href = `/products/${item.id}/`;
            name.textContent = item.name;

            const size = document.createElement("select");
            size.className = "basket-size";
            size.setAttribute("aria-label", `${item.name} хэмжээ`);

            const sizes = Array.isArray(item.sizes)
                ? item.sizes
                : [item.size];

            sizes.forEach((value) => {
                const option = document.createElement("option");

                option.value = value;
                option.textContent = `Size ${value}`;
                option.selected = value === item.size;

                size.append(option);
            });

            size.addEventListener("change", () => {
                changeSize(item.id, item.size, size.value);
            });

            const bottom = document.createElement("div");
            bottom.className = "basket-item-bottom";

            const quantity = document.createElement("div");
            quantity.className = "basket-quantity";

            const minus = quantityButton(
                "−",
                "Тоо ширхэг хасах",
                () => changeQuantity(item.id, item.size, -1)
            );

            const amount = document.createElement("span");
            amount.textContent = item.quantity;

            const plus = quantityButton(
                "+",
                "Тоо ширхэг нэмэх",
                () => changeQuantity(item.id, item.size, 1)
            );

            quantity.append(minus, amount, plus);

            const price = document.createElement("strong");
            price.className = "basket-item-price";
            price.textContent = money(item.price * item.quantity);

            bottom.append(quantity, price);
            info.append(name, size, bottom);

            const remove = quantityButton(
                "×",
                `${item.name} устгах`,
                () => removeItem(item.id, item.size)
            );

            remove.className = "basket-remove";

            row.append(imageLink, info, remove);
            return row;
        }

        function fillItems(container) {
            if (!container) return;

            container.replaceChildren();

            if (!basket.length) {
                const empty = document.createElement("p");
                empty.className = "basket-empty";
                empty.textContent = "Таны сагс хоосон байна.";
                container.append(empty);
                return;
            }

            basket.forEach((item) => {
                container.append(makeItemRow(item));
            });
        }

        function renderBasket() {
            const quantity = basket.reduce(
                (sum, item) => sum + item.quantity,
                0
            );

            const total = basket.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const headerCount = document.getElementById("headerCartCount");

            if (headerCount) {
                headerCount.textContent = quantity;
                headerCount.hidden = quantity === 0;
            }

            const miniCount = document.getElementById("miniCartCount");
            const miniTotal = document.getElementById("miniCartTotal");
            const pageTotal = document.getElementById("cartPageTotal");

            if (miniCount) miniCount.textContent = quantity;
            if (miniTotal) miniTotal.textContent = money(total);
            if (pageTotal) pageTotal.textContent = money(total);

            cartButton?.setAttribute(
                "aria-label",
                `Сагс нээх, ${quantity} бараа`
            );

            fillItems(miniItems);
            fillItems(pageItems);
        }

        if (cartButton && miniCart) {
            cartButton.addEventListener("click", () => {
                setCartOpen(miniCart.hidden);
            });

            document.getElementById("closeCart")?.addEventListener(
                "click",
                () => {
                    setCartOpen(false);
                    cartButton.focus();
                }
            );

            document.addEventListener("click", (event) => {
                const path = event.composedPath();

                if (
                    !path.includes(miniCart) &&
                    !path.includes(cartButton)
                ) {
                    setCartOpen(false);
                }
            }, true);

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && !miniCart.hidden) {
                    setCartOpen(false);
                    cartButton.focus();
                }
            });
        }

        addButton?.addEventListener("click", () => {
            if (addButton.disabled) return;

            const selected = document.querySelector(
                'input[name="product_size"]:checked'
            );

            if (!selected) {
                showToast("Хэмжээгээ сонгоно уу.");
                return;
            }

            const input = document.getElementById("productQuantity");
            const quantity = clampQuantity(input?.value);
            const id = Number(addButton.dataset.id);
            const price = Number(addButton.dataset.price);

            if (
                !Number.isInteger(id) ||
                !addButton.dataset.name ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                showToast("Барааны мэдээлэл дутуу байна.");
                return;
            }

            if (input) input.value = quantity;

            const existing = findItem(id, selected.value);

            if (existing) {
                existing.quantity = Math.min(
                    99,
                    existing.quantity + quantity
                );
            } else {
                basket.push({
                    id,
                    name: addButton.dataset.name,
                    price,
                    image: addButton.dataset.image,
                    size: selected.value,
                    sizes: [...document.querySelectorAll(
                        'input[name="product_size"]'
                    )].map((radio) => radio.value),
                    quantity
                });
            }

            saveBasket();
            showToast("Сагсанд нэмэгдлээ");
        });

        window.addEventListener("storage", (event) => {
            if (event.key === storageKey || event.key === null) {
                basket = readItems(localStorage, storageKey);
                renderBasket();
            }
        });

        window.addEventListener("pageshow", () => {
            basket = readItems(localStorage, storageKey);
            renderBasket();
        });

        renderBasket();
    })();


    /* ==============================================
       ЗАХИАЛГЫН БАРААГ УНШИХ
    ============================================== */

    function readOrderItems() {
        const directOrder = new URLSearchParams(
            location.search
        ).get("buy_now") === "1";

        return directOrder
            ? readItems(sessionStorage, "kef_buy_now")
            : readItems(localStorage, "kef_shop_cart_v1");
    }


    /* ==============================================
       ЗАХИАЛГА → МЭДЭЭЛЭЛ → ТӨЛБӨР
    ============================================== */

    (() => {
        const itemsContainer = document.getElementById("orderItems");

        if (!itemsContainer) return;

        const layout = document.getElementById("orderLayout");
        const empty = document.getElementById("orderEmpty");
        const form = document.getElementById("orderForm");
        const zone = document.getElementById("deliveryZone");
        const infoTab = document.getElementById("orderInfoTab");
        const paymentTab = document.getElementById("orderPaymentTab");
        const paymentPanel = document.getElementById("orderPaymentPanel");
        const payButton = document.getElementById("orderPayButton");
        const successDialog = document.getElementById("orderSuccessDialog");

        if (
            !layout || !empty || !form || !zone ||
            !infoTab || !paymentTab || !paymentPanel ||
            !payButton || !successDialog
        ) return;

        let basket = [];
        let subtotal = 0;
        let confirmed = false;

        function deliveryFee() {
            return Number(zone.value) || 0;
        }

        function updateTotals() {
            const subtotalElement = document.getElementById("orderSubtotal");
            const deliveryElement = document.getElementById("orderDelivery");
            const totalElement = document.getElementById("orderTotal");

            if (subtotalElement) {
                subtotalElement.textContent = money(subtotal);
            }

            if (deliveryElement) {
                deliveryElement.textContent = money(deliveryFee());
            }

            if (totalElement) {
                totalElement.textContent = money(
                    subtotal + deliveryFee()
                );
            }
        }

        function showStep(step) {
            const payment = step === "payment";

            form.hidden = payment;
            paymentPanel.hidden = !payment;

            infoTab.classList.toggle("active", !payment);
            paymentTab.classList.toggle("active", payment);

            infoTab.setAttribute("aria-pressed", String(!payment));
            paymentTab.setAttribute("aria-pressed", String(payment));
        }

        function renderOrder() {
            basket = readOrderItems();
            itemsContainer.replaceChildren();

            layout.hidden = basket.length === 0;
            empty.hidden = basket.length !== 0;

            subtotal = basket.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const count = document.getElementById("orderItemCount");

            if (count) {
                count.textContent = `${basket.length}/${basket.length}`;
            }

            basket.forEach((item) => {
                const row = document.createElement("article");
                row.className = "order-product";

                const image = document.createElement("img");
                image.className = "order-product-image";
                image.alt = item.name;

                if (item.image) image.src = item.image;

                const info = document.createElement("div");
                info.className = "order-product-info";

                const name = document.createElement("a");
                name.className = "order-product-name";
                name.href = `/products/${item.id}/`;
                name.textContent = item.name;

                const size = document.createElement("span");
                size.className = "order-product-size";
                size.textContent = `Size ${item.size}`;

                const bottom = document.createElement("div");
                bottom.className = "order-product-bottom";

                const quantity = document.createElement("span");
                quantity.className = "order-product-quantity";
                quantity.textContent = `Тоо ширхэг: ${item.quantity}`;

                const price = document.createElement("strong");
                price.textContent = money(item.price * item.quantity);

                bottom.append(quantity, price);
                info.append(name, size, bottom);
                row.append(image, info);
                itemsContainer.append(row);
            });

            updateTotals();
        }

        zone.addEventListener("change", updateTotals);

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!form.reportValidity()) return;

            paymentTab.disabled = false;
            showStep("payment");
            paymentTab.focus();
        });

        infoTab.addEventListener("click", () => {
            showStep("info");
        });

        paymentTab.addEventListener("click", () => {
            if (!form.checkValidity()) {
                showStep("info");
                form.reportValidity();
                return;
            }

            showStep("payment");
        });

        document.getElementById("orderCouponButton")?.addEventListener(
            "click",
            () => {
                const input = document.getElementById("orderCoupon");
                const message = document.getElementById("orderCouponMessage");

                if (!message) return;

                message.textContent = input?.value.trim()
                    ? "Энэ купон код идэвхгүй байна."
                    : "Купон кодоо оруулна уу.";

                message.hidden = false;
            }
        );

        payButton.addEventListener("click", () => {
            if (confirmed) return;

            if (!form.checkValidity()) {
                showStep("info");
                form.reportValidity();
                return;
            }

            const current = readOrderItems();

            if (JSON.stringify(current) !== JSON.stringify(basket)) {
                renderOrder();
                paymentTab.disabled = true;
                showStep("info");

                if (basket.length) {
                    alert(
                        "Захиалгын бараа өөрчлөгдсөн байна. " +
                        "Дүнгээ шалгаад дахин үргэлжлүүлнэ үү."
                    );
                }

                return;
            }

            if (!basket.length) {
                renderOrder();
                return;
            }

            const method = document.querySelector(
                'input[name="payment_method"]:checked'
            );

            if (!method) {
                alert("Төлбөрийн аргаа сонгоно уу.");
                return;
            }

            const successTotal = document.getElementById(
                "orderSuccessTotal"
            );

            if (successTotal) {
                successTotal.textContent =
                    `Нийт дүн: ${money(subtotal + deliveryFee())} · ` +
                    `Сонгосон арга: ${method.value}`;
            }

            successDialog.showModal();
            confirmed = true;
            payButton.disabled = true;

            // Үзүүлэн хувилбар.
            // Бодит төлбөр авахгүй, сагсыг устгахгүй.
        });

        renderOrder();
    })();


    /* ==============================================
       ӨМНӨХ CHECKOUT TEMPLATE-ИЙН ДЭМЖЛЭГ
    ============================================== */

    (() => {
        const container = document.getElementById("checkoutItems");

        if (!container) return;

        const basket = readOrderItems();
        const layout = document.getElementById("checkoutLayout");
        const empty = document.getElementById("checkoutEmpty");

        if (layout) layout.hidden = basket.length === 0;
        if (empty) empty.hidden = basket.length !== 0;

        container.replaceChildren();

        let total = 0;

        basket.forEach((item) => {
            const row = document.createElement("article");
            row.className = "checkout-product";

            const image = document.createElement("img");
            image.alt = item.name;

            if (item.image) image.src = item.image;

            const info = document.createElement("div");
            info.className = "checkout-product-info";

            const name = document.createElement("a");
            name.href = `/products/${item.id}/`;
            name.textContent = item.name;

            const details = document.createElement("p");
            details.textContent =
                `Size ${item.size} · ${item.quantity} ширхэг`;

            info.append(name, details);

            const price = document.createElement("strong");
            price.textContent = money(item.price * item.quantity);

            row.append(image, info, price);
            container.append(row);

            total += item.price * item.quantity;
        });

        ["checkoutSubtotal", "checkoutTotal"].forEach((id) => {
            const element = document.getElementById(id);

            if (element) element.textContent = money(total);
        });

        const form = document.getElementById("checkoutInfoForm");

        form?.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!form.reportValidity()) return;

            const data = new FormData(form);
            const review = document.getElementById("checkoutReview");
            const text = document.getElementById("checkoutReviewText");

            if (!review || !text) return;

            text.textContent = [
                `Нэр: ${data.get("name") || ""}`,
                `Утас: ${data.get("phone") || ""}`,
                `Хаяг: ${data.get("city") || ""}, ` +
                `${data.get("district") || ""}, ` +
                `${data.get("khoroo") || ""}, ` +
                `${data.get("address") || ""}`,
                `Нэмэлт мэдээлэл: ${data.get("note") || "Байхгүй"}`,
                `Барааны дүн: ${money(total)}`
            ].join("\n");

            review.hidden = false;
            review.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
    })();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeShop, {
        once: true
    });
} else {
    initializeShop();
}