// This script handles the order summary display on order.html

document.addEventListener("DOMContentLoaded", () => {
  const cartSummaryDiv = document.getElementById("cart-summary");
  const cartSummaryMobileDiv = document.getElementById("cart-summary-mobile");
  const cartIconCount = document.getElementById("cart-count");
  const cartIconTotal = document.getElementById("cart-total");

  // Retrieve cart from localStorage. Use 'let' because the cart array might be reassigned (e.g., when an item is removed)
  let cart = JSON.parse(localStorage.getItem("ravioliCart")) || [];

  /**
   * Saves the current state of the 'cart' array to localStorage.
   */
  function saveCart() {
    localStorage.setItem("ravioliCart", JSON.stringify(cart));
  }

  /**
   * Renders the cart summary details on the order page.
   * This function now also sets up event listeners for remove and quantity change.
   */
  function renderOrderSummary() {
    if (!cartSummaryDiv || !cartSummaryMobileDiv) {
      console.error("Cart summary elements not found on order.html.");
      return;
    }

    let summaryHtml = '';
    let totalItems = 0;
    let subtotal = 0;
    const discountThreshold = 5;
    const discountRate = 0.10; // 10%

    if (cart.length === 0) {
      summaryHtml = '<p class="cart-empty-message">Your cart is empty.</p>';
      cartSummaryDiv.innerHTML = summaryHtml;
      cartSummaryMobileDiv.innerHTML = summaryHtml;
      // Hide the summary sections when the cart is empty
      cartSummaryDiv.classList.add("hidden");
      cartSummaryMobileDiv.classList.add("hidden");
      updateHeaderCart(0, 0); // Update header cart
      return;
    } else {
      // Ensure summary sections are visible if cart is NOT empty
      cartSummaryDiv.classList.remove("hidden");
      cartSummaryMobileDiv.classList.remove("hidden");
    }

    summaryHtml += `
      <h2 class="order-summary-title">Your Order Summary</h2>
      <div class="cart-list">
    `;

    cart.forEach(item => {
      // Safely get price and quantity, defaulting to 0 if undefined or not a number
      const itemPrice = typeof item.price === 'number' ? item.price : 0;
      const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 0;

      const lineTotal = itemPrice * itemQuantity;
      subtotal += lineTotal;
      totalItems += itemQuantity;

      // Concatenate personalization details for display
      let personalizationDetails = [];
      if (item.topLine) personalizationDetails.push(`Top: ${item.topLine}`);
      if (item.bottomLine) personalizationDetails.push(`Bottom: ${item.bottomLine}`);
      if (item.dedication) personalizationDetails.push(`Dedication: ${item.dedication}`);
      const personalizationText = personalizationDetails.length > 0
        ? personalizationDetails.join(' | ')
        : 'N/A';

      summaryHtml += `
        <div class="cart-item" data-identifier="${item.identifier}">
          <div class="item-name">${item.productName || 'Unknown Product'}</div>
          <div class="item-color">${item.color || 'N/A'}</div>
          <div class="item-details">${personalizationText}</div>
          <div class="item-qty">
            <input type="number"
                   min="1"
                   max="999"
                   value="${itemQuantity}"
                   class="quantity-input"
                   data-identifier="${item.identifier}">
          </div>
          <div class="item-price">£${itemPrice.toFixed(2)}</div>
          <div class="item-total">£${lineTotal.toFixed(2)}</div>
          <div class="item-remove">
            <button class="remove-item-btn"
                    data-identifier="${item.identifier}">
              &times;
            </button>
          </div>
        </div>
      `;
    });

    summaryHtml += `</div>`;

    let finalTotal = subtotal;
    let discountApplied = false;

    if (totalItems >= discountThreshold) {
      finalTotal = subtotal * (1 - discountRate);
      discountApplied = true;
    }

    // Discount message area
    const discountNoteClass = "discount-note";
    const discountNoteColorClass = discountApplied ? "discount-applied" : "discount-info";
    const discountNoteMessage = discountApplied
      ? `🥳 10% discount applied! You saved £${(subtotal * discountRate).toFixed(2)}!`
      : `Buy ${discountThreshold} or more items to get a 10% discount!`;

    summaryHtml += `
      <div class="summary-totals">
        <p class="summary-subtotal">Subtotal: £${subtotal.toFixed(2)}</p>
        <p class="summary-final-total">Total: £${finalTotal.toFixed(2)}</p>
        <div id="discount-note" class="${discountNoteClass} ${discountNoteColorClass}">
          ${discountNoteMessage}
        </div>
      </div>
    `;

    cartSummaryDiv.innerHTML = summaryHtml;
    // Assuming mobile summary content is the same, just adjust its display via CSS
    cartSummaryMobileDiv.innerHTML = summaryHtml;

    // After updating innerHTML, add event listeners using delegation
    addSummaryEventListeners();

    // Update the cart icon in the header (which is also present on order.html)
    updateHeaderCart(totalItems, finalTotal);
  }

  /**
   * Adds event listeners to dynamically created elements in the summary table.
   * Uses event delegation on the cartSummaryDiv.
   */
  function addSummaryEventListeners() {
    // Attach event listeners with delegation for mobile Safari compatibility
    cartSummaryDiv.addEventListener('click', function(event) {
      if (event.target.classList.contains('remove-item-btn')) {
        const identifierToRemove = event.target.dataset.identifier;
        removeItem(identifierToRemove);
      }
    });

    cartSummaryDiv.addEventListener('input', function(event) {
      if (event.target.classList.contains('quantity-input')) {
        const identifierToUpdate = event.target.dataset.identifier;
        const newQuantity = parseInt(event.target.value, 10);
        updateItemQuantity(identifierToUpdate, newQuantity);
      }
    });
  }

//   function handleRemoveClick(event) {
//     if (event.target.classList.contains('remove-item-btn')) {
//       const identifierToRemove = event.target.dataset.identifier;
//       removeItem(identifierToRemove);
//     }
//   }

//   function handleQuantityChange(event) {
//     if (event.target.classList.contains('quantity-input')) {
//       const identifierToUpdate = event.target.dataset.identifier;
//       const newQuantity = parseInt(event.target.value, 10); // Ensure base 10
//       updateItemQuantity(identifierToUpdate, newQuantity);
//     }
//   }


  /**
   * Removes an item from the cart.
   * @param {string} identifier The unique identifier of the item to remove.
   */
  function removeItem(identifier) {
    cart = cart.filter(item => item.identifier !== identifier);
    saveCart();
    renderOrderSummary(); // Re-render the summary after removal
  }

  /**
   * Updates the quantity of an item in the cart.
   * @param {string} identifier The unique identifier of the item to update.
   * @param {number} newQuantity The new quantity for the item.
   */
  function updateItemQuantity(identifier, newQuantity) {
    // Validate newQuantity
    if (isNaN(newQuantity) || newQuantity < 1 || newQuantity > 999) {
      showMessageBox("Please enter a valid quantity between 1 and 999.");
      // Re-render to revert to the last valid quantity if input was invalid
      renderOrderSummary();
      return;
    }

    const itemToUpdate = cart.find(item => item.identifier === identifier);
    if (itemToUpdate) {
      itemToUpdate.quantity = newQuantity;
      saveCart();
      renderOrderSummary(); // Re-render the summary after quantity update
    }
  }

  /**
   * Updates the cart count and total in the page header.
   * @param {number} count Total number of items.
   * @param {number} total Total price.
   */
  function updateHeaderCart(count, total) {
    if (cartIconCount) {
      cartIconCount.textContent = count;
    }
    if (cartIconTotal) {
      // Ensure total is a number before calling toFixed
      cartIconTotal.textContent = `£${typeof total === 'number' ? total.toFixed(2) : '0.00'}`;
    }
  }

  // Initial call to renderOrderSummary when the page loads
  renderOrderSummary();

  // PayPal button integration
  if (typeof paypal !== 'undefined') {
    paypal.Buttons({
      // Apply the requested PayPal button styles
      style: {
        shape: "rect",
        color: "blue",
        layout: "vertical",
        label: "pay",
      },
      // Use the server-side API to create the order
      createOrder: (data, actions) => {
        return fetch(`https://ravioli-stamp.vercel.app/api/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart }), // Send the current client-side cart
        })
        .then((response) => {
          if (!response.ok) {
            // Handle HTTP errors from your API
            return response.json().then(err => { throw new Error(err.error || 'Failed to create PayPal order via API'); });
          }
          return response.json();
        })
        .then((order) => {
          return order.orderID; // Return the order ID from your API response
        })
        .catch((error) => {
          console.error('Error creating PayPal order via API:', error);
          showMessageBox("Could not create PayPal order. Please try again or contact support.");
          // You might want to re-throw or return actions.reject() here
          throw error; // Propagate the error to PayPal SDK
        });
      },
      onApprove: function(data, actions) {
        // Capture the funds from the transaction
        return actions.order.capture().then(function(details) {
          showMessageBox(`Transaction completed by ${details.payer.name.given_name}!`);
          // Clear the cart after successful payment
          localStorage.removeItem("ravioliCart");
          cart.length = 0; // Clear the in-memory cart
          renderOrderSummary(); // Re-render to show empty cart
          updateHeaderCart(0, 0); // Update header cart
        });
      },
      onError: function(err) {
        console.error('PayPal button error:', err);
        showMessageBox("An error occurred with the PayPal payment. Please try again.");
      }
    }).render('#paypal-button-container'); // Render the PayPal button into the div
  } else {
    console.warn('PayPal SDK not loaded or paypal object not available.');
    // You might want to show a message to the user here
    // Ensure this message is displayed in a user-friendly way, not just in console
    cartSummaryDiv.innerHTML += '<p class="paypal-error-message">PayPal payment not available. Please ensure PayPal SDK is loaded and your internet connection is stable.</p>';
  }

  /**
   * Custom message box function to replace `alert()`.
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

    setTimeout(() => {
      messageBox.remove();
    }, 3000); // Display for 3 seconds
  }
});
