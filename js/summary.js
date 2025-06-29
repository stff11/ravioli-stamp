function addSummaryEventListeners() {
  cartSummaryDiv.addEventListener('click', function (event) {
    console.log("Click event detected:", event.target);

    const removeBtn = event.target.closest('.remove-item-btn');
    if (removeBtn) {
      console.log("Remove button clicked:", removeBtn.dataset.identifier);
      removeItem(removeBtn.dataset.identifier);
      return;
    }

    const increaseBtn = event.target.closest('.qty-increase');
    if (increaseBtn) {
      console.log("Increase button clicked:", increaseBtn.dataset.identifier);
      adjustQuantity(increaseBtn.dataset.identifier, 1);
      return;
    }

    const decreaseBtn = event.target.closest('.qty-decrease');
    if (decreaseBtn) {
      console.log("Decrease button clicked:", decreaseBtn.dataset.identifier);
      adjustQuantity(decreaseBtn.dataset.identifier, -1);
      return;
    }
  });

  cartSummaryDiv.addEventListener('change', function (event) {
    console.log("Change event detected:", event.target);

    const input = event.target.closest('.quantity-input');
    if (input) {
      console.log("Quantity input changed:", input.dataset.identifier, input.value);
      updateItemQuantity(input.dataset.identifier, parseInt(input.value, 10));
    }
  });
}