// public/cart.js
// Надёжная логика корзины в localStorage — event delegation, нормализация id, render + inc/dec/remove, checkout.
(function() {
    const CART_KEY = 'cart';

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (e) {
            console.error('Ошибка чтения cart из localStorage', e);
            localStorage.removeItem(CART_KEY);
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderCartCount();
    }

    function renderCartCount() {
        const el = document.getElementById('cart-count');
        if (!el) return;
        const cart = getCart();
        const totalItems = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        el.textContent = totalItems;
    }

    function addToCart({ id, name, price, qty = 1 }) {
        id = String(id); // нормализуем id как строку (везде одинаково)
        price = Number(price) || 0;
        qty = Number(qty) || 1;

        const cart = getCart();
        const existing = cart.find(item => String(item.id) === id);
        if (existing) {
            existing.quantity = Number(existing.quantity) + qty;
        } else {
            cart.push({ id, name, price, quantity: qty });
        }
        saveCart(cart);
    }

    // Безопасный экранирующий helper для вывода
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // Рендер корзины на /cart
    function renderCart() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('total');
        if (!container) return;

        const cart = getCart();
        container.innerHTML = '';

        if (cart.length === 0) {
            container.innerHTML = '<p>Корзина пуста</p>';
            if (totalEl) totalEl.textContent = '';
            return;
        }

        let grandTotal = 0;
        cart.forEach((item, idx) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 0;
            const sum = price * qty;
            grandTotal += sum;

            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = `
        <div class="cart-left">
          <strong>${escapeHtml(item.name)}</strong>
        </div>
        <div class="cart-controls">
          <button class="dec" data-index="${idx}">−</button>
          <span class="qty">${qty}</span>
          <button class="inc" data-index="${idx}">+</button>
        </div>
        <div class="cart-right">
          ${price} ₽ × ${qty} = ${sum} ₽
          <button class="remove" data-index="${idx}">Удалить</button>
        </div>
      `;
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = 'Итого: ' + grandTotal + ' ₽';
    }

    // Делегирование: добавление товара (любая страница)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart');
        if (!btn) return;

        const id = btn.dataset.id;
        const name = btn.dataset.name || 'Товар';
        const price = btn.dataset.price || 0;

        if (!id) {
            console.error('Нет data-id у кнопки добавления в корзину', btn);
            return;
        }

        addToCart({ id, name, price, qty: 1 });

        // быстрый UX — маленькая подсказка
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Добавлено';
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = oldText;
        }, 800);
    });

    // Делегирование: inc/dec/remove на странице корзины
    document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove');
        if (removeBtn) {
            const idx = Number(removeBtn.dataset.index);
            const cart = getCart();
            if (!Number.isNaN(idx) && idx >= 0 && idx < cart.length) {
                cart.splice(idx, 1);
                saveCart(cart);
                renderCart();
            }
            return;
        }

        const inc = e.target.closest('.inc');
        if (inc) {
            const idx = Number(inc.dataset.index);
            const cart = getCart();
            if (!Number.isNaN(idx) && cart[idx]) {
                cart[idx].quantity = Number(cart[idx].quantity) + 1;
                saveCart(cart);
                renderCart();
            }
            return;
        }

        const dec = e.target.closest('.dec');
        if (dec) {
            const idx = Number(dec.dataset.index);
            const cart = getCart();
            if (!Number.isNaN(idx) && cart[idx]) {
                cart[idx].quantity = Math.max(1, Number(cart[idx].quantity) - 1);
                saveCart(cart);
                renderCart();
            }
            return;
        }
    });

    // Оформление заказа (на /cart)
    document.addEventListener('click', async (e) => {
        const checkoutBtn = e.target.closest('#checkout');
        if (!checkoutBtn) return;

        const cart = getCart();
        if (!cart || cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        checkoutBtn.disabled = true;
        try {
            const resp = await fetch('/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart })
            });

            const data = await resp.json();
            if (resp.ok && data.success) {
                alert('Заказ оформлен! Номер заказа: ' + data.order.id);
                localStorage.removeItem(CART_KEY);
                renderCart();
                renderCartCount();
            } else {
                console.error('checkout error:', data);
                alert(data.error || 'Ошибка при оформлении заказа');
            }
        } catch (err) {
            console.error('Network/checkout error', err);
            alert('Ошибка сети при оформлении заказа');
        } finally {
            checkoutBtn.disabled = false;
        }
    });

    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        renderCartCount();
        renderCart();
    });

})();
