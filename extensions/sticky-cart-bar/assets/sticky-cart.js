document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector("#sticky-cart-bar");
  if (!bar) return;

  const btn = bar.querySelector(".sticky-cart__btn");
  const variantSelect = bar.querySelector(".sticky-cart__variant-select");
  const qtyInput = bar.querySelector(".sticky-cart__qty-input");
  const qtyBtns = bar.querySelectorAll(".sticky-cart__qty-btn");
  const priceEl = bar.querySelector(".sticky-cart__price");
  const shippingBar = bar.querySelector(".sticky-cart__shipping-bar");
  const shippingProgress = bar.querySelector(".sticky-cart__shipping-progress");
  const shippingText = bar.querySelector(".sticky-cart__shipping-text");

  let currentVariantId = bar.dataset.variantId;
  const scrollThreshold = parseInt(bar.dataset.scrollThreshold) || 300;
  const autoHideSeconds = parseInt(bar.dataset.autoHideSeconds) || 0;
  const hideOnScrollUp = bar.dataset.hideOnScrollUp === "true";
  const shippingThreshold = parseFloat(bar.dataset.shippingThreshold) || 50;
  const showShippingBar = bar.dataset.showShippingBar === "true";
  const shippingMessage = bar.dataset.shippingMessage || "Add {amount} more for free shipping!";

  let lastScrollY = window.scrollY;
  let hideTimeout;
  let isVisible = false;

  // Toast notification
  function showToast(message, type = "error") {
    const toast = document.createElement("div");
    toast.className = `sticky-cart-toast sticky-cart-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Smart visibility
  function updateVisibility() {
    const currentScrollY = window.scrollY;
    const shouldShow = currentScrollY > scrollThreshold;
    const scrollingUp = currentScrollY < lastScrollY;

    if (shouldShow && (!hideOnScrollUp || !scrollingUp)) {
      if (!isVisible) {
        bar.classList.add("visible");
        isVisible = true;
        
        if (autoHideSeconds > 0) {
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            bar.classList.remove("visible");
            isVisible = false;
          }, autoHideSeconds * 1000);
        }
      }
    } else if (hideOnScrollUp && scrollingUp && isVisible) {
      bar.classList.remove("visible");
      isVisible = false;
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener("scroll", updateVisibility);
  updateVisibility();

  // Variant selector
  if (variantSelect) {
    variantSelect.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      currentVariantId = selectedOption.value;
      const price = selectedOption.dataset.price;
      
      if (priceEl && price) {
        // Format price (basic formatting, adjust as needed)
        const formattedPrice = "$" + (parseFloat(price) / 100).toFixed(2);
        priceEl.textContent = formattedPrice;
      }
      
      bar.dataset.variantId = currentVariantId;
    });
  }

  // Quantity selector
  qtyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      let currentQty = parseInt(qtyInput.value) || 1;
      const min = parseInt(qtyInput.min) || 1;
      const max = parseInt(qtyInput.max) || 99;

      if (action === "increase" && currentQty < max) {
        qtyInput.value = currentQty + 1;
      } else if (action === "decrease" && currentQty > min) {
        qtyInput.value = currentQty - 1;
      }

      updateShippingBar();
    });
  });

  qtyInput.addEventListener("change", () => {
    const min = parseInt(qtyInput.min) || 1;
    const max = parseInt(qtyInput.max) || 99;
    let value = parseInt(qtyInput.value) || min;
    
    if (value < min) value = min;
    if (value > max) value = max;
    
    qtyInput.value = value;
    updateShippingBar();
  });

  // Free shipping progress bar
  async function updateShippingBar() {
    if (!showShippingBar || !shippingBar) return;

    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();
      const cartTotal = cart.total_price / 100;
      const remaining = Math.max(0, shippingThreshold - cartTotal);
      const progress = Math.min(100, (cartTotal / shippingThreshold) * 100);

      shippingProgress.style.width = progress + "%";

      if (remaining > 0) {
        const message = shippingMessage.replace("{amount}", "$" + remaining.toFixed(2));
        shippingText.textContent = message;
      } else {
        shippingText.textContent = "🎉 You qualify for free shipping!";
      }
    } catch (error) {
      console.error("Failed to update shipping bar:", error);
    }
  }

  if (showShippingBar) {
    updateShippingBar();
  }

  // Add to cart
  btn.addEventListener("click", async () => {
    const originalText = btn.innerText;
    const quantity = parseInt(qtyInput.value) || 1;
    
    btn.disabled = true;
    btn.innerText = "Adding...";

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentVariantId,
          quantity: quantity
        })
      });

      if (response.ok) {
        btn.innerText = "Added ✓";
        
        // Update shipping bar
        if (showShippingBar) {
          setTimeout(() => updateShippingBar(), 100);
        }
        
        // Trigger cart update event
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:refresh', { bubbles: true })
        );
        
        // Reset button after 2 seconds
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
        }, 2000);
      } else {
        const data = await response.json();
        showToast(data.description || "Failed to add item to cart");
        btn.innerText = originalText;
        btn.disabled = false;
      }
    } catch (error) {
      showToast("Something went wrong. Please try again.");
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });
});
