function addSummaryEventListeners() {
  console.log("✅ addSummaryEventListeners() attached");

  cartSummaryDiv.addEventListener('click', function (event) {
    console.log("CLICK detected on:", event.target);

    const removeBtn = event.target.closest('.remove-item-btn');
    if (removeBtn) {
      const id = removeBtn.dataset.identifier;
      console.log("REMOVE BUTTON matched:", removeBtn, "ID:", id);
      if (id) {
        removeItem(id);
      } else {
        console.warn("❗ No identifier found on remove button");
      }
      return;
    }

    const increaseBtn = event.target.closest('.qty-increase');
    if (increaseBtn) {
      const id = increaseBtn.dataset.identifier;
      console.log("INCREASE BUTTON matched:", increaseBtn, "ID:", id);
      if (id) adjustQuantity(id, 1);
      return;
    }

    const decreaseBtn = event.target.closest('.qty-decrease');
    if (decreaseBtn) {
      const id = decreaseBtn.dataset.identifier;
      console.log("DECREASE BUTTON matched:", decreaseBtn, "ID:", id);
      if (id) adjustQuantity(id, -1);
      return;
    }
  });

  cartSummaryDiv.addEventListener('change', function (event) {
    console.log("CHANGE detected on:", event.target);

    const input = event.target.closest('.quantity-input');
    if (input) {
      const id = input.dataset.identifier;
      console.log("Quantity input changed:", id, input.value);
      if (id) updateItemQuantity(id, parseInt(input.value, 10));
    }
  });
}