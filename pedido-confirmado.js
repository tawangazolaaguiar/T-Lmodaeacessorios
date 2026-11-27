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

  document.querySelector("#confirmation-order-number").textContent = order.orderNumber || "Pedido demonstrativo";
  document.querySelector("#confirmation-order-date").textContent = order.createdAt ? new Date(order.createdAt).toLocaleString("pt-BR") : "Data não disponível";
  const customer = order.customer || {};
  const address = customer.address || {};
  const addressLine = [address.street, address.number, address.complement, address.neighborhood, [address.city, address.state].filter(Boolean).join(" - "), address.postalCode ? "CEP " + address.postalCode : ""].filter(Boolean).join(", ");
  document.querySelector("#confirmation-customer-name").textContent = customer.name || "Não informado";
  document.querySelector("#confirmation-customer-email").textContent = customer.email || "Não informado";
  document.querySelector("#confirmation-customer-address").textContent = addressLine || "Não informado";
  document.querySelector("#confirmation-invoice-number").textContent = order.invoiceNumber || "DEMONSTRAÇÃO";
  document.querySelector("#confirmation-email-recipient").textContent = customer.email || "E-mail não informado";

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
  const itemLines = items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return "• " + product.name + " — " + item.quantity + " un. — " + money.format(product.price * item.quantity);
  });
  const emailText = [
    "Olá, " + (customer.name || "cliente") + "!", "",
    "A L&A Moda & Acessórios agradece pela sua preferência.",
    "Esta é uma COMPRA DE DEMONSTRAÇÃO; nenhum pedido real ou pagamento foi processado.", "",
    "Pedido: " + (order.orderNumber || "Demonstrativo"),
    "Data: " + (order.createdAt ? new Date(order.createdAt).toLocaleString("pt-BR") : "—"), "",
    "Produtos:", ...itemLines, "",
    "Subtotal: " + money.format(order.subtotal),
    "Frete estimado: " + money.format(order.shipping),
    "Juros: " + money.format(order.interest || 0),
    "Total demonstrativo: " + money.format(order.total), "",
    "Endereço informado: " + (addressLine || "Não informado"), "",
    "Comprovante: " + (order.invoiceNumber || "DEMONSTRAÇÃO"),
    "SEM VALOR FISCAL — NÃO É NOTA FISCAL ELETRÔNICA.", "",
    "Prévia de mensagem. Nenhum e-mail foi enviado nesta versão de demonstração."
  ].join("\n");
  document.querySelector("#confirmation-email-preview").textContent = emailText;
  document.querySelector("#confirmation-email-status").textContent = "Prévia preparada. O e-mail ainda não foi enviado: o serviço de envio precisa ser configurado."; 
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
