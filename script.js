    const products = {
      "everyday-polo": { name: "Everyday Knit Polo", price: 42 },
      "daybreak-chino": { name: "Daybreak Chino", price: 58 },
      "rib-collar-polo": { name: "Rib Collar Polo", price: 38 },
      "easy-cotton-trouser": { name: "Easy Cotton Trouser", price: 54 }
    };
    const bag = new Map();
    const bagPanel = document.querySelector("#bag-panel");
    const bagToggle = document.querySelector(".bag-toggle");
    const toast = document.querySelector(".toast");
    let toastTimer;

    function renderBag() {
      const items = [...bag.entries()];
      const quantity = items.reduce((sum, [, count]) => sum + count, 0);
      const total = items.reduce((sum, [id, count]) => sum + products[id].price * count, 0);
      document.querySelector(".bag-count").textContent = quantity;
      document.querySelector(".bag-count").setAttribute("aria-label", `${quantity} ${quantity === 1 ? "item" : "items"}`);
      document.querySelector(".bag-items").innerHTML = items.length
        ? items.map(([id, count]) => `<div class="bag-item"><span>${products[id].name} × ${count}</span><span>$${products[id].price * count}</span></div>`).join("")
        : '<p class="bag-empty">Your bag is empty for now.</p>';
      document.querySelector(".bag-total span:last-child").textContent = `$${total}`;
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.filter;
        document.querySelectorAll(".filter-button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        let visible = 0;
        document.querySelectorAll(".product").forEach((product) => {
          const matches = category === "all" || product.dataset.category === category;
          product.hidden = !matches;
          if (matches) visible++;
        });
        document.querySelector("#empty-state").style.display = visible ? "none" : "block";
      });
    });

    document.querySelectorAll("[data-filter-link]").forEach((link) => {
      link.addEventListener("click", () => {
        const filter = document.querySelector(`[data-filter="${link.dataset.filterLink}"]`);
        if (filter) filter.click();
        document.querySelector("#main-nav").classList.remove("open");
        document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
        document.querySelector(".menu-toggle").setAttribute("aria-label", "Open navigation");
      });
    });

    document.querySelectorAll(".add-button").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        bag.set(id, (bag.get(id) || 0) + 1);
        renderBag();
        showToast(`${products[id].name} added to your bag`);
      });
    });

    bagToggle.addEventListener("click", () => {
      const open = bagPanel.classList.toggle("open");
      bagToggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelector(".close-bag").addEventListener("click", () => {
      bagPanel.classList.remove("open");
      bagToggle.setAttribute("aria-expanded", "false");
      bagToggle.focus();
    });
    document.querySelector(".menu-toggle").addEventListener("click", (event) => {
      const open = document.querySelector("#main-nav").classList.toggle("open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
      event.currentTarget.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    document.querySelector(".checkout-button").addEventListener("click", () => showToast("Checkout can be connected when your store is ready."));
    document.querySelector("#year").textContent = new Date().getFullYear();
 