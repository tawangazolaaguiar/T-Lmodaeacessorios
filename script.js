const products = window.LA_PRODUCTS;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const productGrid = document.querySelector("#produtos");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const cartDrawer = document.querySelector("#cart-drawer");
const backdrop = document.querySelector("#drawer-backdrop");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const drawerFooter = document.querySelector("#drawer-footer");
const toast = document.querySelector("#toast");
let activeCategory = "Todos";
let cart = loadCart();
let toastTimeout;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("la-moda-cart") || "[]");
    if (!Array.isArray(savedCart)) return [];
    return savedCart.filter((item) =>
      Number.isInteger(item.id) && products.some((product) => product.id === item.id) &&
      Number.isInteger(item.quantity) && item.quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("la-moda-cart", JSON.stringify(cart));
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category}`.toLocaleLowerCase("pt-BR").includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <button class="add-button" data-add-product="${product.id}" aria-label="Adicionar ${product.name} à sacola">Adicionar à sacola +</button>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${money.format(product.price)}${product.oldPrice ? `<del>${money.format(product.oldPrice)}</del>` : ""}</p>
      </div>
    </article>
  `).join("");
  emptyState.hidden = visibleProducts.length > 0;
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + product.price * item.quantity;
  }, 0);

  document.querySelector("#cart-count").textContent = itemCount;
  document.querySelector("#drawer-item-count").textContent = `(${itemCount})`;
  document.querySelector("#cart-subtotal").textContent = money.format(subtotal);
  cartEmpty.classList.toggle("visible", cart.length === 0);
  drawerFooter.hidden = cart.length === 0;
  cartItems.innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `
      <article class="cart-item">
        <img src="${product.image}" alt="" loading="lazy">
        <div class="cart-item-info">
          <strong>${product.name}</strong>
          <span>${money.format(product.price)}</span>
          <div class="quantity-control" aria-label="Quantidade de ${product.name}">
            <button data-quantity-change="-1" data-product-id="${product.id}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button data-quantity-change="1" data-product-id="${product.id}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <div class="cart-item-end">
          <strong>${money.format(product.price * item.quantity)}</strong>
          <button class="remove-item" data-remove-product="${product.id}">Remover</button>
        </div>
      </article>
    `;
  }).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openCart() {
  cartDrawer.classList.add("open");
  backdrop.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.querySelector("#close-drawer").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  backdrop.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.querySelector("#cart-trigger").focus();
}

document.querySelector("#colecao").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (!tab) return;
  activeCategory = tab.dataset.category;
  document.querySelectorAll(".category-tab").forEach((button) => {
    const selected = button === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
});

document.querySelectorAll("[data-nav-category]").forEach((link) => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.navCategory;
    document.querySelectorAll(".category-tab").forEach((button) => {
      const selected = button.dataset.category === activeCategory;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (!button) return;
  const id = Number(button.dataset.addProduct);
  const item = cart.find((entry) => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  renderCart();
  showToast(`${products.find((product) => product.id === id).name} adicionado à sacola`);
});

cartItems.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity-change]");
  const removeButton = event.target.closest("[data-remove-product]");
  if (quantityButton) {
    const id = Number(quantityButton.dataset.productId);
    const item = cart.find((entry) => entry.id === id);
    item.quantity += Number(quantityButton.dataset.quantityChange);
    if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== id);
  } else if (removeButton) {
    const id = Number(removeButton.dataset.removeProduct);
    cart = cart.filter((entry) => entry.id !== id);
  } else {
    return;
  }
  saveCart();
  renderCart();
});

document.querySelector("#cart-trigger").addEventListener("click", openCart);
document.querySelector("#close-drawer").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) closeCart();
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Adicione pelo menos um produto à sacola.");
    return;
  }
  window.location.assign("checkout.html");
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent = "Obrigada! Você receberá nossas novidades em breve.";
  event.currentTarget.reset();
});

renderProducts();
renderCart();
