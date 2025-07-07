// Overlay logic
const overlay = document.getElementById("product-overlay");
const buyButtons = document.querySelectorAll(".buy-button");
let selectedProduct = null; // Will store the full product object, not just its name

// Using a single constant price for all stamps, assuming it's defined elsewhere (e.g., script.js)
// If this price needs to be fetched dynamically or vary per product, this logic would need adjustment.
const STAMP_BASE_PRICE = 14.99;

// Language detection and translations
const LANG = document.cookie.match(/(?:^|;\s*)langPref=(\w+)/)?.[1] || 'en';

const TEXT = {
  en: {
    pleaseSelect: "No product selected. Please select a product first.",
    invalidQty: "Please enter a valid quantity (1–999)."
  },
  it: {
    pleaseSelect: "Nessun prodotto selezionato. Seleziona prima un prodotto.",
    invalidQty: "Inserisci una quantità valida (1–999)."
  },
  pl: {
    pleaseSelect: "Nie wybrano produktu. Najpierw wybierz produkt.",
    invalidQty: "Wprowadź poprawną ilość (1–999)."
  }
};

// Initialize cart from localStorage or as an empty array
// This ensures that the cart data persists even if the user closes and reopens the browser.
let cart = JSON.parse(localStorage.getItem("ravioliCart")) || [];

/**
 * Updates the display of the cart icon with the total quantity of items.
 * This function should be called whenever the cart content changes.
 */
function renderCart() {
  const cartIcon = document.getElementById("cart-icon");
  // Check for the cart-icon and its children for cart-count and cart-total
  const cartCountSpan = document.getElementById("cart-count");
  const cartTotalSpan = document.getElementById("cart-total");

  if (!cartIcon || !cartCountSpan || !cartTotalSpan) {
    console.warn("Cart icon or its detail spans not found. Please ensure elements with ids 'cart-icon', 'cart-count', and 'cart-total' exist.");
    return;
  }

  // Calculate the total quantity and total price of items in the cart
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Update the cart icon's HTML
  cartCountSpan.textContent = totalQty;
  cartTotalSpan.textContent = `£${totalPrice.toFixed(2)}`;

  // You can also adjust the main cart icon content if needed
  if (totalQty > 0) {
    // This part is already handled by the spans inside cartIcon, no change needed here.
    // If you only had the emoji, this would be: cartIcon.innerHTML = `🛒 <span>${totalQty}</span>`;
  } else {
    // If cart is empty, you might want to reset total and count directly
    cartCountSpan.textContent = 0;
    cartTotalSpan.textContent = `£0.00`;
  }
}

/**
 * Adds a visual animation to the cart icon to indicate an item has been added.
 */
function animateCartIcon() {
  const cartIcon = document.getElementById("cart-icon");
  if (cartIcon) {
    cartIcon.classList.add("animate-cart"); // Add a class for animation
    // Remove the animation class after a short delay to allow it to be re-triggered
    setTimeout(() => {
      cartIcon.classList.remove("animate-cart");
    }, 500); // Animation duration
  }
}

/**
 * Saves the current state of the 'cart' array to localStorage.
 * The cart array is converted to a JSON string before saving.
 */
function saveCart() {
  localStorage.setItem("ravioliCart", JSON.stringify(cart));
}

// Event listeners for "Buy" buttons to open the product overlay
buyButtons.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    // Get the product name from the corresponding product item
    const productItem = event.target.closest(".product-item");
    if (productItem) {
      const productName = productItem.querySelector("h3").textContent;
      // Use the global STAMP_BASE_PRICE for all products
      const productPrice = STAMP_BASE_PRICE; 

      selectedProduct = { // Store as an object
        name: productName,
        price: productPrice,
        // Other properties like description, size could be added here if needed
      };
      overlay.classList.remove("hidden"); // Show the overlay
    }
  });
});

// Event listener for "Cancel" button in the overlay
document.getElementById("close-overlay").addEventListener("click", () => {
  overlay.classList.add("hidden"); // Hide the overlay
  // Clear fields and selection when cancelling
  document.getElementById("top-line").value = "";
  document.getElementById("bottom-line").value = "";
  document.getElementById("dedication").value = "";
  document.getElementById("overlay-qty").value = "1";
  document.querySelectorAll(".color-swatch").forEach(btn => btn.classList.remove("selected"));
  selectedProduct = null; // Clear selected product
});

// Event listener for "Add Another" button in the overlay
document.getElementById("add-another").addEventListener("click", () => {
  if (handleOverlayAdd()) { // If item successfully added to cart
    overlay.classList.add("hidden"); // Hide the overlay
  }
});

// Event listener for "Add & Checkout" button in the overlay
document.getElementById("add-and-checkout").addEventListener("click", () => {
  if (handleOverlayAdd()) { // If item successfully added to cart
    window.location.href = `/${LANG}/order.html`;
  }
});

/**
 * Handles the logic for adding an item from the overlay to the cart.
 * It validates input, constructs the item label, updates the cart array,
 * saves to localStorage, and updates the UI.
 * @returns {boolean} True if the item was successfully added, false otherwise.
 */
function handleOverlayAdd() {
  if (!selectedProduct) {
    showMessageBox(TEXT[LANG].pleaseSelect);
    return false;
  }

  // Get selected color, defaulting to "Black" if none is selected
  const color = document.querySelector(".color-swatch.selected")?.dataset.color || "Black";
  const top = document.getElementById("top-line").value.trim();
  const bottom = document.getElementById("bottom-line").value.trim();
  const dedication = document.getElementById("dedication").value.trim();
  const qty = parseInt(document.getElementById("overlay-qty").value);

  // Validate quantity input
  if (isNaN(qty) || qty < 1 || qty > 999) {
    // Use a custom message box instead of alert() for better UX
    showMessageBox(TEXT[LANG].invalidQty);
    return false;
  }

  // Construct a unique identifier for the item based on all its properties
  // This ensures that "Square Stamp (Red) - Top: ABC" is treated differently from "Square Stamp (Red)"
  let itemIdentifier = `${selectedProduct.name}:::${color}:::${top}:::${bottom}:::${dedication}`;

  // Check if the item already exists in the cart based on its unique identifier
  const existingItem = cart.find(item => item.identifier === itemIdentifier);

  if (existingItem) {
    // If it exists, just update the quantity
    existingItem.quantity += qty;
  } else {
    // If it's a new item, add it to the cart with all details
    cart.push({
      identifier: itemIdentifier, // Unique ID for finding existing items
      productName: selectedProduct.name,
      color: color,
      topLine: top,
      bottomLine: bottom,
      dedication: dedication,
      price: selectedProduct.price, // Use the price from selectedProduct
      quantity: qty
    });
  }

  saveCart(); // Save the updated cart to localStorage
  renderCart(); // Update the cart display
  animateCartIcon(); // Animate the cart icon

  // Clear the overlay input fields after adding to cart
  document.getElementById("top-line").value = "";
  document.getElementById("bottom-line").value = "";
  document.getElementById("dedication").value = "";
  document.getElementById("overlay-qty").value = "1";
  // Deselect any chosen color swatch
  document.querySelectorAll(".color-swatch").forEach(btn => btn.classList.remove("selected"));
  selectedProduct = null; // Clear selected product after adding to cart

  return true;
}

// Event listeners for color swatches to handle selection
document.querySelectorAll(".color-swatch").forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove 'selected' class from all swatches
    document.querySelectorAll(".color-swatch").forEach(innerBtn => innerBtn.classList.remove("selected"));
    // Add 'selected' class to the clicked swatch
    btn.classList.add("selected");
  });
});

/**
 * Custom message box function to replace `alert()`.
 * This would ideally create a modal or a temporary message element.
 * For this example, it simply logs to console and adds a temporary message to the body.
 * In a real application, you'd implement a proper modal dialog.
 * @param {string} message The message to display.
 */
function showMessageBox(message) {
  console.warn("Message Box:", message); // Log to console for debugging

  const messageBox = document.createElement("div");
  messageBox.textContent = message;
  messageBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #333;
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    font-family: 'Inter', sans-serif;
    text-align: center;
  `;
  document.body.appendChild(messageBox);

  // Automatically remove the message box after a few seconds
  setTimeout(() => {
    messageBox.remove();
  }, 3000); // Display for 3 seconds
}

// Initial render of the cart when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  renderCart(); // Call renderCart to display initial cart quantity and total


  document.querySelectorAll('.product-image-slider').forEach(slider => {
    const mainImages = slider.querySelectorAll('.main-image');
    const thumbs = slider.querySelectorAll('.thumb');
    const frontSash = slider.querySelector('.sash.front');
    const backSash = slider.querySelector('.sash.back');
    let currentIndex = 0;

    function updateSlider(index) {
      mainImages.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
      if (frontSash) frontSash.style.display = index === 0 ? 'block' : 'none';
      if (backSash) backSash.style.display = index === 1 ? 'block' : 'none';
      currentIndex = index;
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        updateSlider(i);
      });
    });

    const prevBtn = slider.querySelector('.nav-arrow.prev');
    const nextBtn = slider.querySelector('.nav-arrow.next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
        updateSlider(newIndex);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % mainImages.length;
        updateSlider(newIndex);
      });
    }

    updateSlider(0); // Initialize
  });

  // Change the text in the preview
const svgTop = document.getElementById("svg-top");
const svgBottom = document.getElementById("svg-bottom");
const svgDedication = document.getElementById("svg-dedication");

document.getElementById("top-line").addEventListener("input", e => {
  svgTop.textContent = e.target.value.toUpperCase() || "YOUR TEXT";
});
document.getElementById("bottom-line").addEventListener("input", e => {
  svgBottom.textContent = e.target.value.toUpperCase() || "HERE";
});
document.getElementById("dedication").addEventListener("input", e => {
  svgDedication.textContent = e.target.value || "Your message here";
});

document.getElementById("toggle-preview").addEventListener("click", () => {
  const previews = document.getElementById("stamp-previews");
  previews.classList.toggle("hidden");
  const btn = document.getElementById("toggle-preview");
  btn.textContent = previews.classList.contains("hidden")
    ? "Show Preview"
    : "Hide Preview";
});
});
