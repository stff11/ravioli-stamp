const LANG = document.cookie.match(/(?:^|;\s*)langPref=(\w+)/)?.[1] || 'en';

const TEXT = {
  en: {
    emptyCart: "Your cart is empty.",
    browse: "Browse products",
    yourOrder: "Your Order Summary",
    subtotal: "Subtotal",
    total: "Total",
    discountInfo: "Buy 5 or more for 10% Off",
    discountApplied: "🥳 10% discount applied!",
    thankYou: name => `Thank you for your order ${name}!`,
    error: "Something went wrong during the transaction.",
    tableHeaders: ["Product", "Color", "Personalisation", "Qty", "Price", "Total", "Remove"],
    orderTitle: "Your Order",
  },
  it: {
    emptyCart: "Il tuo carrello è vuoto.",
    browse: "Scopri i prodotti",
    yourOrder: "Riepilogo Ordine",
    subtotal: "Subtotale",
    total: "Totale",
    discountInfo: "Acquista 5 o più per uno sconto del 10%",
    discountApplied: "🥳 Sconto del 10% applicato!",
    thankYou: name => `Grazie per il tuo ordine, ${name}!`,
    error: "Si è verificato un errore durante la transazione.",
    tableHeaders: ["Prodotto", "Colore", "Personalizzazione", "Qtà", "Prezzo", "Totale", "Rimuovi"],
    orderTitle: "Il Tuo Ordine",
  },
  pl: {
    emptyCart: "Twój koszyk jest pusty.",
    browse: "Zobacz produkty",
    yourOrder: "Podsumowanie zamówienia",
    subtotal: "Suma częściowa",
    total: "Razem",
    discountInfo: "Kup 5 lub więcej i otrzymaj 10% zniżki",
    discountApplied: "🥳 Zastosowano zniżkę 10%!",
    thankYou: name => `Dziękujemy za zamówienie, ${name}!`,
    error: "Coś poszło nie tak podczas transakcji.",
    tableHeaders: ["Produkt", "Kolor", "Personalizacja", "Ilość", "Cena", "Razem", "Usuń"],
    orderTitle: "Twoje Zamówienie",
  }
};

const cartSummaryDiv = document.getElementById("cart-summary");

let cart = JSON.parse(localStorage.getItem("ravioliCart") || "[]");

function saveCart() {
  localStorage.setItem("ravioliCart", JSON.stringify(cart));
}

function formatGBP(amount) {
  return `£${amount.toFixed(2)}`;
}

function calculateTotal() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  let totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const discountApplied = totalQty >= 5;
  if (discountApplied) {
    totalPrice = totalPrice * 0.9;
  }

  return { totalPrice, discountApplied, totalQty };
}

function renderOrderSummary() {
  if (!cartSummaryDiv) {
    console.error("Cart summary elements not found on order.html.");
    return;
  }

  if (cart.length === 0) {
  const emptyMessage = `
    <div class="empty-cart-message">
      <p>${TEXT[LANG].emptyCart}</p>
      <p><a href="/#products" class="cta-button">${TEXT[LANG].browse}</a></p>
    </div>
  `;
  cartSummaryDiv.innerHTML = emptyMessage;

  // Also hide PayPal buttons if they exist
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) paypalContainer.innerHTML = '';

  return;
}

  const { totalPrice, discountApplied, totalQty } = calculateTotal();

  let summaryHtml = `
    <h2>${TEXT[LANG].yourOrder}</h2>
    <div class="cart-table-container">
      <table class="order-summary-table">
        <thead><tr>
          ${TEXT[LANG].tableHeaders.map(h => `<th>${h}</th>`).join('')}
        </tr></thead>
        <tbody>
  `;

  cart.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    const personalization = [];

    if (item.topLine) personalization.push(item.topLine);
    if (item.bottomLine) personalization.push(item.bottomLine);
    if (item.dedication) personalization.push(item.dedication);

    summaryHtml += `
      <tr data-identifier="${item.identifier}">
        <td>${item.productName}</td>
        <td>${item.color}</td>
        <td>${personalization.join(" | ")}</td>
        <td>
          <div class="qty-controls">
            <button class="qty-decrease" data-identifier="${item.identifier}">−</button>
            <input type="number" min="1" max="999" value="${item.quantity}" class="quantity-input" data-identifier="${item.identifier}">
            <button class="qty-increase" data-identifier="${item.identifier}">+</button>
          </div>
        </td>
        <td>${formatGBP(item.price)}</td>
        <td class="item-total">${formatGBP(lineTotal)}</td>
        <td>
          <button class="remove-item-btn" data-identifier="${item.identifier}">✕</button>
        </td>
      </tr>
    `;
  });

  summaryHtml += `
        </tbody>
      </table>
      <p class="${discountApplied ? 'discount-applied' : 'discount-info'}">
        ${discountApplied ? TEXT[LANG].discountApplied : TEXT[LANG].discountInfo}
      </p>
      <p class="summary-subtotal">${TEXT[LANG].subtotal}: ${formatGBP(totalPrice)}</p>
      <p class="summary-final-total">${TEXT[LANG].total}: ${formatGBP(totalPrice)}</p>
    </div>
  `;

  cartSummaryDiv.innerHTML = summaryHtml;
}

function addSummaryEventListeners(container) {
  console.log("Adding event listeners to container:", container.id);

  container.addEventListener('click', function (event) {
    console.log("Click event detected:", event.target);
    const removeBtn = event.target.closest('.remove-item-btn');
    if (removeBtn) {
      console.log("Remove button clicked, identifier:", removeBtn.dataset.identifier);
      removeItem(removeBtn.dataset.identifier);
      return;
    }

    const increaseBtn = event.target.closest('.qty-increase');
    if (increaseBtn) {
      console.log("Increase button clicked, identifier:", increaseBtn.dataset.identifier);
      adjustQuantity(increaseBtn.dataset.identifier, 1);
      return;
    }

    const decreaseBtn = event.target.closest('.qty-decrease');
    if (decreaseBtn) {
      console.log("Decrease button clicked, identifier:", decreaseBtn.dataset.identifier);
      adjustQuantity(decreaseBtn.dataset.identifier, -1);
      return;
    }
  });

  container.addEventListener('change', function (event) {
    console.log("Change event detected:", event.target);
    const input = event.target.closest('.quantity-input');
    if (input) {
      console.log("Quantity input changed, identifier:", input.dataset.identifier, "value:", input.value);
      updateItemQuantity(input.dataset.identifier, parseInt(input.value, 10));
    }
  });
}

// Adjust qty by clicking +- buttons
function adjustQuantity(identifier, delta) {
  const index = cart.findIndex(i => i.identifier === identifier);
  if (index === -1) return;

  // Clone the item to avoid mutation bugs
  const updatedItem = { ...cart[index] };
  updatedItem.quantity = Math.max(1, updatedItem.quantity + delta);
  cart[index] = updatedItem;

  saveCart();
  renderOrderSummary();

  // Prevent cursor jump on mobile
  setTimeout(() => {
    const input = document.querySelector(`.quantity-input[data-identifier="${identifier}"]`);
    if (input) {
      input.focus();
      input.blur();
    }
  }, 50);
}

// Manually type the input qty
function updateItemQuantity(identifier, newQuantity) {
  const item = cart.find(i => i.identifier === identifier);
  if (!item) return;
  if (newQuantity < 1) {
    updateItemQuantity(identifier, 1);
    return;
  }
  item.quantity = newQuantity;
  saveCart();
  renderOrderSummary();
}

function removeItem(identifier) {
  cart = cart.filter(i => i.identifier !== identifier);
  saveCart();
  renderOrderSummary();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, starting render...");
  addSummaryEventListeners(cartSummaryDiv);
  renderOrderSummary();
  const h1Title = document.getElementById("order-title");
  if (h1Title) h1Title.textContent = TEXT[LANG].orderTitle;
  // Dynamically update home icon href based on language
  const homeIcon = document.getElementById("home-icon");
  if (homeIcon) homeIcon.href = `/${LANG}/index.html`;
  waitForPayPalSDK().then(() => {
    renderPayPalButtons();
  });
});

function waitForPayPalSDK() {
  return new Promise((resolve) => {
    if (window.paypal && window.paypal.Buttons) {
      console.log("✅ PayPal SDK is ready immediately");
      return resolve();
    }

    const interval = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        clearInterval(interval);
        console.log("✅ PayPal SDK is now ready");
        resolve();
      }
    }, 100);
  });
}

// Render PayPal Buttons
function renderPayPalButtons() {
  const paypalContainer = document.getElementById('paypal-button-container');
  if (!paypalContainer || cart.length === 0) return;

  paypalContainer.innerHTML = ''; // Clear existing buttons

  paypal.Buttons({
    style: {
      shape: 'rect',
      color: 'blue',
      layout: 'vertical',
      label: 'pay',
    },

    createOrder: function(data, actions) {
      return fetch('https://ravioli-stamp.vercel.app/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cart })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
      })
      .then(data => data.orderID);
    },

    onApprove: function(data, actions) {
      return actions.order.capture().then(details => {
        alert(TEXT[LANG].thankYou(details.payer.name.given_name));
        cart = [];
        saveCart();
        renderOrderSummary();
      });
    },

    onError: function(err) {
      console.error("PayPal Checkout Error:", err);
      alert(TEXT[LANG].error);
    }
  }).render('#paypal-button-container');
}