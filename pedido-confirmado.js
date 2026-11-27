import "./products.js";
import { supabase } from "./supabase-client.js";

const products = window.LA_PRODUCTS || [];
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const confirmationCard = document.querySelector("#confirmation-card");
const confirmationError = document.querySelector("#confirmation-error");
const emailStatus = document.querySelector("#confirmation-email-status");
const emailPreview = document.querySelector("#confirmation-email-preview");
const retryButton = document.querySelector("#confirmation-email-retry");

function showUnavailable() {
  confirmationError.hidden = false;
}

function saveOrder(order) {
  try {
    sessionStorage.setItem("la-moda-demo-order", JSON.stringify(order));
  } catch (error) {
    console.error("Não foi possível atualizar o resumo da demonstração.", error);
  }
}

function renderConfirmation(order) {
  if (!Array.isArray(order.items) || order.items.length === 0 ||
      !Number.isFinite(order.subtotal) || !Number.isFinite(order.shipping) ||
      !Number.isFinite(order.total) || typeof order.shippingRegion !== "string") {
    showUnavailable();
    return false;
  }

  const items = order.items.filter((item) =>
    Number.isInteger(item.id) && products.some((product) => product.id === item.id) &&
    Number.isInteger(item.quantity) && item.quantity > 0
  );
  if (items.length !== order.items.length) {
    showUnavailable();
    return false;
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
  document.querySelector("#confirmation-email-recipient").textContent = customer.email || "E-mail da conta autenticada";

  document.querySelector("#confirmation-subtotal").textContent = money.format(order.subtotal);
  document.querySelector("#confirmation-shipping").textContent = `${money.format(order.shipping)} · ${order.shippingRegion}`;
  const interestRow = document.querySelector("#confirmation-interest-row");
  interestRow.hidden = !(Number.isFinite(order.interest) && order.interest > 0);
  document.querySelector("#confirmation-interest").textContent = money.format(order.interest || 0);
  document.querySelector("#confirmation-total").textContent = money.format(order.total);

  const paymentLabels = { pix: "PIX", debit: "Cartão de débito", credit: "Cartão de crédito" };
  if (!paymentLabels[order.payment]) {
    showUnavailable();
    return false;
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
    order.emailStatus === "sent"
      ? "O e-mail demonstrativo foi enviado com o PDF anexado."
      : "O e-mail será enviado após a preparação do comprovante demonstrativo."
  ].join("\n");
  emailPreview.textContent = emailText;
  confirmationCard.hidden = false;
  return true;
}

async function sendDemoOrderEmail(order) {
  retryButton.hidden = true;
  retryButton.disabled = true;
  emailStatus.textContent = "Preparando o comprovante e enviando o e-mail…";
  emailPreview.textContent = emailPreview.textContent.replace(
    "O e-mail será enviado após a preparação do comprovante demonstrativo.",
    "Aguarde enquanto preparamos o comprovante demonstrativo."
  );

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error("Sua sessão não está ativa. Entre na sua conta e refaça o teste do checkout.");
    }

    const { data, error } = await supabase.functions.invoke("send-demo-order-email", {
      body: { order }
    });
    if (error) {
      let detail = error.message || "Falha ao chamar a função de envio.";
      try {
        const response = error.context;
        if (response && typeof response.json === "function") {
          const payload = await response.json();
          if (payload?.error) detail = payload.error;
        }
      } catch (_) {
        // Mantém a mensagem original quando a resposta não contém JSON legível.
      }
      throw new Error(detail);
    }
    if (!data?.success || !data.orderNumber || !data.invoiceNumber) {
      throw new Error(data?.error || "O serviço não confirmou o envio do e-mail.");
    }

    order.emailStatus = "sent";
    order.orderNumber = data.orderNumber;
    order.invoiceNumber = data.invoiceNumber;
    order.emailId = data.emailId || null;
    saveOrder(order);

    document.querySelector("#confirmation-order-number").textContent = data.orderNumber;
    document.querySelector("#confirmation-invoice-number").textContent = data.invoiceNumber;
    emailStatus.textContent = "E-mail enviado com sucesso para " + (data.email || order.customer?.email || "o e-mail da sua conta") + ". O PDF demonstrativo foi anexado.";
    emailPreview.textContent = emailPreview.textContent
      .replace(/Pedido: .*/, "Pedido: " + data.orderNumber)
      .replace(/Comprovante: .*/, "Comprovante: " + data.invoiceNumber)
      .replace("Aguarde enquanto preparamos o comprovante demonstrativo.", "O e-mail demonstrativo foi enviado com o PDF anexado.");
  } catch (error) {
    console.error("Não foi possível enviar o e-mail demonstrativo.", error);
    emailStatus.textContent = "Não foi possível enviar o e-mail: " + error.message;
    emailPreview.textContent = emailPreview.textContent.replace(
      "Aguarde enquanto preparamos o comprovante demonstrativo.",
      "O e-mail não foi enviado. Você pode tentar novamente."
    );
    retryButton.hidden = false;
  } finally {
    retryButton.disabled = false;
  }
}

let order;
try {
  order = JSON.parse(sessionStorage.getItem("la-moda-demo-order") || "null");
} catch (error) {
  console.error("Não foi possível ler o resumo do pedido.", error);
  showUnavailable();
}

if (order && renderConfirmation(order)) {
  if (order.emailStatus === "sent") {
    emailStatus.textContent = "Este e-mail demonstrativo já foi enviado nesta sessão.";
  } else {
    sendDemoOrderEmail(order);
  }
} else if (!order) {
  showUnavailable();
}

retryButton.addEventListener("click", () => {
  if (order) sendDemoOrderEmail(order);
});
