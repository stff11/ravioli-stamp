const cartSummaryDiv = document.getElementById("cart-summary");
const cartSummaryMobileDiv = document.getElementById("cart-summary-mobile");

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
  if (!cartSummaryDiv || !cartSummaryMobileDiv) {
    console.error("Cart summary elements not found on order.html.");
    return;
  }

  if (cart.length === 0) {
    cartSummaryDiv.innerHTML = "<p>Your cart is empty.</p>";
    cartSummaryMobileDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  const { totalPrice, discountApplied, totalQty } = calculateTotal();

  let summaryHtml = `
    <h2>Your Order Summary</h2>
    <div class="cart-table-container">
      <table class="order-summary-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Color</th>
            <th>Personalisation</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>Remove</th>
          </tr>
        </thead>
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
          <input type="number" min="1" max="999" value="${item.quantity}" class="quantity-input" data-identifier="${item.identifier}">
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
      <p class="summary-subtotal">Subtotal: ${formatGBP(totalPrice)}</p>
      ${discountApplied ? '<p class="discount-note">10% discount applied for 5 or more stamps!</p>' : ''}
      <p class="summary-final-total">Total: ${formatGBP(totalPrice)}</p>
    </div>
  `;

  cartSummaryDiv.innerHTML = summaryHtml;
  cartSummaryMobileDiv.innerHTML = summaryHtml;

  addSummaryEventListeners(cartSummaryDiv);
  addSummaryEventListeners(cartSummaryMobileDiv);
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
  renderOrderSummary();
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
        alert(`Transaction completed by ${details.payer.name.given_name}!`);
        cart = [];
        saveCart();
        renderOrderSummary();
      });
    },

    onError: function(err) {
      console.error("PayPal Checkout Error:", err);
      alert("Something went wrong during the transaction.");
    }
  }).render('#paypal-button-container');
}