const products = window.LA_PRODUCTS;
const checkoutUtils = window.LA_CHECKOUT_UTILS;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const form = document.querySelector("#checkout-form");
const checkoutLayout = document.querySelector("#checkout-layout");
const checkoutEmpty = document.querySelector("#checkout-empty");
const summaryProducts = document.querySelector("#summary-products");
const checkoutFeedback = document.querySelector("#checkout-feedback");
const cepInput = document.querySelector("#customer-cep");
const cepStatus = document.querySelector("#cep-status");
const cpfInput = document.querySelector("#customer-cpf");
const installmentSelect = document.querySelector("#installments");
const installmentField = document.querySelector("#installment-field");
const cardDetails = document.querySelector("#card-details");
const pixDemoDetails = document.querySelector("#pix-demo-details");
const pixCopyCode = document.querySelector("#pix-copy-code");
const pixCopyButton = document.querySelector("#pix-copy-button");
const pixCopyStatus = document.querySelector("#pix-copy-status");
let cart = [];
let cartLoadError = false;
let shippingEstimate = null;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("la-moda-cart") || "[]");
    if (!Array.isArray(savedCart)) return [];
    return savedCart.filter((item) =>
      Number.isInteger(item.id) && products.some((product) => product.id === item.id) &&
      Number.isInteger(item.quantity) && item.quantity > 0
    );
  } catch (error) {
    console.error("Não foi possível ler a sacola salva.", error);
    cartLoadError = true;
    return [];
  }
}

function getSubtotal() {
  return cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + product.price * item.quantity;
  }, 0);
}

function getSelectedPayment() {
  return form.querySelector('input[name="payment"]:checked').value;
}

function getSelectedInstallments() {
  return Number(installmentSelect.value || 1);
}

function getFinancing() {
  if (getSelectedPayment() !== "credit") {
    return { total: getSubtotal(), interest: 0, monthly: getSubtotal(), count: 1 };
  }
  const count = getSelectedInstallments();
  return { ...checkoutUtils.calculateInstallments(getSubtotal(), count), count };
}

function renderProducts() {
  summaryProducts.innerHTML = cart.map((item) => {
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
}

function renderInstallments() {
  const currentValue = installmentSelect.value || "1";
  installmentSelect.innerHTML = Array.from({ length: 12 }, (_, index) => {
    const count = index + 1;
    const installment = checkoutUtils.calculateInstallments(getSubtotal(), count);
    const interestLabel = count <= 3 ? "sem juros" : "com juros de 3% a.m.";
    return `<option value="${count}">${count}x de ${money.format(installment.monthly)} ${interestLabel}</option>`;
  }).join("");
  installmentSelect.value = currentValue;
}

function updatePaymentSummary() {
  const payment = getSelectedPayment();
  installmentField.hidden = payment !== "credit";
  cardDetails.hidden = payment === "pix";
  cardDetails.disabled = payment === "pix";
  pixDemoDetails.hidden = payment !== "pix";
  const financing = getFinancing();
  const interestRow = document.querySelector("#summary-interest-row");
  interestRow.hidden = financing.interest <= 0;
  document.querySelector("#summary-interest").textContent = money.format(financing.interest);

  const shipping = shippingEstimate ? shippingEstimate.price : 0;
  const total = financing.total + shipping;
  document.querySelector("#summary-total").textContent = money.format(total);
  const installmentSummary = document.querySelector("#installment-summary");
  installmentSummary.textContent = payment === "credit"
    ? `${financing.count}x de ${money.format(financing.monthly)} ${financing.count <= 3 ? "sem juros" : "com juros de 3% ao mês"}`
    : "";
}

function updateShippingSummary() {
  shippingEstimate = checkoutUtils.estimateShipping(cepInput.value);
  if (shippingEstimate) {
    document.querySelector("#summary-shipping").textContent = money.format(shippingEstimate.price);
    cepStatus.textContent = `Frete estimado para ${shippingEstimate.region}, saindo de Brasília.`;
    cepStatus.classList.remove("field-error");
    document.querySelector("#shipping-disclaimer").textContent =
      "Estimativa regional para envio de Brasília. O frete oficial pode variar conforme peso, dimensões e transportadora.";
  } else {
    document.querySelector("#summary-shipping").textContent = "Informe o CEP";
    cepStatus.textContent = "Informe um CEP válido para estimar o frete.";
    document.querySelector("#shipping-disclaimer").textContent =
      "Frete estimado para envio de Brasília. O valor pode variar conforme peso, dimensões e cotação da transportadora.";
  }
  updatePaymentSummary();
}

async function lookupAddress() {
  const cep = cepInput.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  cepStatus.textContent = "Consultando CEP…";
  cepStatus.classList.remove("field-error");
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error(`Consulta de CEP retornou HTTP ${response.status}.`);
    const address = await response.json();
    if (address.erro) {
      cepStatus.textContent = "CEP não encontrado. Confira o número ou preencha o endereço manualmente.";
      cepStatus.classList.add("field-error");
      return;
    }

    document.querySelector("#customer-street").value = address.logradouro || "";
    document.querySelector("#customer-neighborhood").value = address.bairro || "";
    document.querySelector("#customer-city").value = address.localidade || "";
    document.querySelector("#customer-state").value = address.uf || "";
    cepStatus.textContent = "Endereço localizado. Confira e complete os campos.";
    cepStatus.classList.remove("field-error");
  } catch (error) {
    console.error("Não foi possível consultar o CEP.", error);
    cepStatus.textContent = "Não foi possível consultar este CEP. Preencha o endereço manualmente.";
    cepStatus.classList.add("field-error");
  }
}

function showEmptyCart() {
  checkoutLayout.hidden = true;
  checkoutEmpty.hidden = false;
  checkoutEmpty.querySelector("p").textContent = cartLoadError
    ? "Não foi possível carregar sua sacola neste navegador. Volte à loja e tente novamente."
    : "Sua sacola está vazia. Escolha seus favoritos para continuar.";
}

function showFeedback(message, isError = true) {
  checkoutFeedback.textContent = message;
  checkoutFeedback.classList.toggle("field-error", isError);
}

form.addEventListener("change", (event) => {
  if (event.target.name === "payment" || event.target.id === "installments") updatePaymentSummary();
});

pixCopyButton.addEventListener("click", async () => {
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(pixCopyCode.value);
      copied = true;
    } catch (error) {
      console.error("Não foi possível copiar o código PIX fictício.", error);
    }
  }
  if (!copied) {
    pixCopyCode.focus();
    pixCopyCode.select();
    copied = document.execCommand?.("copy") || false;
  }
  pixCopyStatus.textContent = copied
    ? "Código fictício copiado."
    : "Não foi possível copiar automaticamente. Selecione e copie o código manualmente.";
});

cepInput.addEventListener("input", () => {
  cepInput.setCustomValidity("");
  updateShippingSummary();
});
cepInput.addEventListener("blur", lookupAddress);
window.LA_CHECKOUT_REFRESH_ADDRESS = () => {
  updateShippingSummary();
  if (cepInput.value.replace(/\\D/g, "").length === 8) lookupAddress();
};
cpfInput.addEventListener("input", () => {
  cpfInput.setCustomValidity("");
  document.querySelector("#cpf-error").textContent = "";
});
cpfInput.addEventListener("blur", () => {
  cpfInput.value = checkoutUtils.formatCPF(cpfInput.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  showFeedback("");
  cpfInput.setCustomValidity("");
  if (!checkoutUtils.isValidCPF(cpfInput.value)) {
    cpfInput.setCustomValidity("Informe um CPF válido.");
    document.querySelector("#cpf-error").textContent = "Confira o CPF informado.";
    cpfInput.reportValidity();
    return;
  }
  if (!shippingEstimate) {
    cepInput.setCustomValidity("Informe um CEP válido para calcular o frete.");
    cepInput.reportValidity();
    return;
  }
  cepInput.setCustomValidity("");

  if (!form.reportValidity()) return;

  const financing = getFinancing();
  const order = {
    items: cart,
    subtotal: getSubtotal(),
    shipping: shippingEstimate.price,
    shippingRegion: shippingEstimate.region,
    payment: getSelectedPayment(),
    installments: financing.count,
    interest: financing.interest,
    total: financing.total + shippingEstimate.price
  };

  try {
    sessionStorage.setItem("la-moda-demo-order", JSON.stringify(order));
    localStorage.removeItem("la-moda-cart");
  } catch (error) {
    console.error("Não foi possível preparar o resumo do pedido ou esvaziar a sacola.", error);
    try {
      sessionStorage.removeItem("la-moda-demo-order");
    } catch (cleanupError) {
      console.error("Não foi possível limpar o resumo preparado após a falha.", cleanupError);
    }
    showFeedback("Não foi possível finalizar o pedido neste navegador. Sua sacola foi mantida para uma nova tentativa.");
    return;
  }
  window.location.assign("pedido-confirmado.html");
});

cart = loadCart();
if (cart.length === 0) {
  showEmptyCart();
} else {
  renderProducts();
  renderInstallments();
  updateShippingSummary();
}
