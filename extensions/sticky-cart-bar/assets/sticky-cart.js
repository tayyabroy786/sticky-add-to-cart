document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector("#sticky-cart-bar");
  if (!bar) return;

  const btn = bar.querySelector(".sticky-cart__btn");
  const variantId = bar.dataset.variantId;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Adding...";

    await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: variantId,
        quantity: 1
      })
    });

    btn.innerText = "Added ✓";
  });
});
