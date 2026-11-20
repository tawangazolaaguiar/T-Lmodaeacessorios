const products = window.LA_PRODUCTS;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const confirmationCard = document.querySelector("#confirmation-card");
const confirmationError = document.querySelector("#confirmation-error");

function showUnavailable() {
  confirmationError.hidden = false;
}

function renderConfirmation(order) {
  if (!Array.isArray(order.items) || order.items.length === 0 ||
      !Number.isFinite(order.subtotal) || !Number.isFinite(order.shipping) ||
      !Number.isFinite(order.total) || typeof order.shippingRegion !== "string") {
    showUnavailable();
    return;
  }

  const items = order.items.filter((item) =>
    Number.isInteger(item.id) && products.some((product) => product.id === item.id) &&
    Number.isInteger(item.quantity) && item.quantity > 0
  );
  if (items.length !== order.items.length) {
    showUnavailable();
    return;
  }

  document.querySelector("#confirmation-products").innerHTML = items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `
      <article class="summary-product">
        <img src="${product.image}" alt="" loading="lazy">
        <div class="summary-product-info">
          <strong>${product.name}</strong>
          <span>Quantidade: ${item.quantity}</span>
        </div>
        <strong class="summary-product-total">${money.format(product.price * item.quantity)}</strong>
      </article>
    `;
  }).join("");

  document.querySelector("#confirmation-subtotal").textContent = money.format(order.subtotal);
  document.querySelector("#confirmation-shipping").textContent =
    `${money.format(order.shipping)} · ${order.shippingRegion}`;
  const interestRow = document.querySelector("#confirmation-interest-row");
  interestRow.hidden = !(Number.isFinite(order.interest) && order.interest > 0);
  document.querySelector("#confirmation-interest").textContent = money.format(order.interest || 0);
  document.querySelector("#confirmation-total").textContent = money.format(order.total);

  const paymentLabels = { pix: "PIX", debit: "Cartão de débito", credit: "Cartão de crédito" };
  if (!paymentLabels[order.payment]) {
    showUnavailable();
    return;
  }
  const installmentLabel = order.payment === "credit" && Number.isInteger(order.installments)
    ? ` · ${order.installments}x`
    : "";
  document.querySelector("#confirmation-payment").textContent = `${paymentLabels[order.payment]}${installmentLabel}`;
  confirmationCard.hidden = false;
}

let order;
try {
  order = JSON.parse(sessionStorage.getItem("la-moda-demo-order") || "null");
} catch (error) {
  console.error("Não foi possível ler o resumo do pedido.", error);
  showUnavailable();
}

if (order) renderConfirmation(order);
else showUnavailable();
