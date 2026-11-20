const products = [
  {
    id: 1, name: "Blusa Aurora", category: "Roupas", price: 129.90, oldPrice: 159.90, badge: "MAIS AMADO",
    image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2, name: "Bolsa Serena", category: "Bolsas", price: 189.90, badge: "NOVO",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3, name: "Colar Elo Dourado", category: "Acessórios", price: 79.90, badge: "",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4, name: "Vestido Florença", category: "Roupas", price: 229.90, badge: "NOVA COLEÇÃO",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5, name: "Óculos Siena", category: "Acessórios", price: 99.90, badge: "",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6, name: "Bolsa Toscana", category: "Bolsas", price: 219.90, oldPrice: 259.90, badge: "−15%",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 7, name: "Camisa Linho Leve", category: "Roupas", price: 159.90, badge: "",
    image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 8, name: "Brincos Sol", category: "Acessórios", price: 69.90, badge: "FEITO À MÃO",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
  }
];

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
  showToast("Sua sacola está pronta! Entre em contato conosco para finalizar seu pedido.");
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent = "Obrigada! Você receberá nossas novidades em breve.";
  event.currentTarget.reset();
});

renderProducts();
renderCart();
