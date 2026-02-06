document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector("#sticky-cart-bar");
  if (!bar) return;

  const btn = bar.querySelector(".sticky-cart__btn");
  const variantId = bar.dataset.variantId;

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

  btn.addEventListener("click", async () => {
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Adding...";

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });

      if (response.ok) {
        btn.innerText = "Added ✓";
        
        // Trigger cart update event for themes with cart drawer
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:refresh', { bubbles: true })
        );
        
        // Fallback: redirect to cart after 1 second if no drawer
        setTimeout(() => {
          if (btn.innerText === "Added ✓") {
            window.location.href = "/cart";
          }
        }, 1000);
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
