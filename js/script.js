const stampNameInput = document.getElementById("stamp-name");
const stampQtyInput = document.getElementById("stamp-qty");
const addToCartBtn = document.getElementById("add-to-cart");
const cartCount = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");
const cartIcon = document.getElementById("cart-icon");
const liveTotal = document.getElementById("live-total");
const discountNote = document.getElementById("discount-note");
const paypalContainer = document.getElementById("paypal-button-container");
const cartItemsList = document.getElementById("cart-items");

const PRICE_PER_STAMP = 14.99;
const DISCOUNT_THRESHOLD = 5;
const DISCOUNT_RATE = 0.10;

const cart = [];

// Restore cart from localStorage if available
const savedCart = JSON.parse(localStorage.getItem("ravioliCart") || "[]");
if (savedCart.length) {
  cart.push(...savedCart);
}

const cartSummary = document.getElementById("cart-summary");

cartIcon.addEventListener("click", () => {
  cartSummary.classList.toggle("hidden");
});

stampNameInput.setAttribute("maxlength", window.MAX_LENGTH);
stampNameInput.setAttribute("placeholder", `Max ${window.MAX_LENGTH} characters`);
document.getElementById("label-name").textContent =
  `Personalisation (max ${window.MAX_LENGTH} characters):`;

function formatGBP(amount) {
  return `£${amount.toFixed(2)}`;
}

function updateLiveTotal() {
  const qty = parseInt(stampQtyInput.value) || 0;
  let total = qty * PRICE_PER_STAMP;

  if (qty >= DISCOUNT_THRESHOLD) {
    total *= 1 - DISCOUNT_RATE;
    discountNote.classList.remove("hidden");
  } else {
    discountNote.classList.add("hidden");
  }

  liveTotal.textContent = `= ${formatGBP(total)}`;
}

function animateCartIcon() {
  cartIcon.classList.add("animate");
  setTimeout(() => cartIcon.classList.remove("animate"), 400);
}

function calculateTotal() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  let totalPrice = totalQty * PRICE_PER_STAMP;

  const discountApplied = totalQty >= DISCOUNT_THRESHOLD;
  if (discountApplied) {
    totalPrice *= 1 - DISCOUNT_RATE;
  }

  return { totalPrice, discountApplied, totalQty };
}

function renderCart() {
  if (cartItemsList) {
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
      cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
    } else {
      cart.forEach((item, i) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} × ${item.quantity}`;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove item";
        removeBtn.style.marginLeft = "1rem";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.color = "var(--color-accent)";
        removeBtn.style.fontWeight = "bold";
        removeBtn.addEventListener("click", () => {
          cart.splice(i, 1);
          renderCart();
        });

        li.appendChild(removeBtn);
        cartItemsList.appendChild(li);
      });
    }
  }

  const { totalPrice, discountApplied, totalQty } = calculateTotal();
  cartCount.textContent = totalQty;
  cartTotalEl.textContent = formatGBP(totalPrice);

  // Always show discount note
  if (discountApplied) {
    discountNote.textContent = `10% discount applied for buying ${totalQty} or more stamps!`;
  } else {
    discountNote.textContent = "10% discount when buying 5 or more!";
  }
  discountNote.classList.remove("hidden");

  // Desktop: dropdown summary
  const cartSummary = document.getElementById("cart-summary");
  if (cartSummary) {
    if (cart.length === 0) {
      cartSummary.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      cartSummary.innerHTML = "<ul></ul>";
      const summaryList = cartSummary.querySelector("ul");
      cart.forEach((item, i) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} × ${item.quantity}`;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove item";
        removeBtn.style.marginLeft = "1rem";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.color = "var(--color-accent)";
        removeBtn.style.fontWeight = "bold";
        removeBtn.addEventListener("click", () => {
          cart.splice(i, 1);
          renderCart();
        });

        li.appendChild(removeBtn);
        summaryList.appendChild(li);
      });
    }
  }

  // Mobile: inline summary
  const cartSummaryMobile = document.getElementById("cart-summary-mobile");
  if (cartSummaryMobile) {
    if (cart.length === 0) {
      cartSummaryMobile.innerHTML = "";
    } else {
      cartSummaryMobile.innerHTML = "<h3>Order Summary:</h3><ul></ul>";
      const mobileSummaryList = cartSummaryMobile.querySelector("ul");
      cart.forEach((item, i) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} × ${item.quantity}`;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove item";
        removeBtn.style.marginLeft = "1rem";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.color = "var(--color-accent)";
        removeBtn.style.fontWeight = "bold";
        removeBtn.addEventListener("click", () => {
          cart.splice(i, 1);
          renderCart();
        });

        li.appendChild(removeBtn);
        mobileSummaryList.appendChild(li);
      });
    }
  }

  // Save cart to localStorage
  localStorage.setItem("ravioliCart", JSON.stringify(cart));

  renderPayPalButtons(totalPrice);
}

function renderPayPalButtons(totalPrice) {
  paypalContainer.innerHTML = "";

  if (cart.length === 0) return;

  paypal.Buttons({
    style: {
      shape: "rect",
      color: "blue",
      layout: "vertical",
      label: "pay",
    },
    createOrder: (data, actions) => {
      return fetch(`https://ravioli-stamp.vercel.app/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to create order");
          return res.json();
        })
        .then((data) => data.orderID);
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then((details) => {
        alert(
          `Transaction completed by ${details.payer.name.given_name}! Thank you for your purchase.`
        );
        cart.length = 0;
        renderCart();
      });
    },
    onError: (err) => {
      alert("An error occurred during the transaction. Please try again.");
      console.error(err);
    },
  }).render("#paypal-button-container");
}

addToCartBtn.addEventListener("click", () => {
  const name = stampNameInput.value.trim();
  const qty = parseInt(stampQtyInput.value);

  if (!name || name.length > window.MAX_LENGTH || qty < 1 || qty > 999) {
    alert(
      `Please enter a valid name (1–${window.MAX_LENGTH} characters) and quantity (1–999).`
    );
    return;
  }

  const existingIndex = cart.findIndex(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (existingIndex !== -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({ name, quantity: qty });
  }

  animateCartIcon();
  stampNameInput.value = "";
  stampQtyInput.value = 1;
  updateLiveTotal();
  renderCart();
});

stampQtyInput.addEventListener("input", updateLiveTotal);
updateLiveTotal();
renderCart();