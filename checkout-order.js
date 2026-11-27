import { supabase } from "./supabase-client.js";

const form = document.querySelector("#checkout-form");
const feedback = document.querySelector("#checkout-feedback");
const submitButton = document.querySelector("#checkout-submit");
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function value(selector) {
  return document.querySelector(selector)?.value?.trim() || "";
}

function showFeedback(message, isError = true) {
  feedback.textContent = message;
  feedback.classList.toggle("field-error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("");

  const cpf = value("#customer-cpf");
  const cep = value("#customer-cep");
  const shipping = window.LA_CHECKOUT_UTILS.estimateShipping(cep);
  if (!window.LA_CHECKOUT_UTILS.isValidCPF(cpf)) {
    document.querySelector("#customer-cpf").setCustomValidity("Informe um CPF válido.");
    document.querySelector("#cpf-error").textContent = "Confira o CPF informado.";
    document.querySelector("#customer-cpf").reportValidity();
    return;
  }
  document.querySelector("#customer-cpf").setCustomValidity("");
  if (!shipping) {
    document.querySelector("#customer-cep").setCustomValidity("Informe um CEP válido para calcular o frete.");
    document.querySelector("#customer-cep").reportValidity();
    return;
  }
  document.querySelector("#customer-cep").setCustomValidity("");
  if (!form.reportValidity()) return;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    showFeedback("Entre na sua conta da L&A antes de concluir o pedido demonstrativo.");
    return;
  }

  const cart = (() => {
    try { return JSON.parse(localStorage.getItem("la-moda-cart") || "[]"); }
    catch { return []; }
  })();
  const payment = form.querySelector('input[name="payment"]:checked')?.value || "pix";
  const installments = payment === "credit" ? Number(value("#installments") || 1) : 1;
  const address = {
    postal_code: cep.replace(/\D/g, ""),
    state: value("#customer-state").toUpperCase(),
    street: value("#customer-street"),
    street_number: value("#customer-number"),
    complement: value("#customer-complement"),
    neighborhood: value("#customer-neighborhood"),
    city: value("#customer-city")
  };

  submitButton.disabled = true;
  submitButton.textContent = "Enviando resumo por e-mail…";
  try {
    const { data, error } = await supabase.functions.invoke("create-demo-order", {
      body: { items: cart, payment, installments, address, customer_name: value("#customer-name"), customer_email: value("#customer-email") }
    });
    if (error) throw error;
    if (!data?.order) throw new Error(data?.message || "A loja não retornou os dados do pedido.");

    sessionStorage.setItem("la-moda-demo-order", JSON.stringify(data.order));
    localStorage.removeItem("la-moda-cart");
    window.location.assign("pedido-confirmado.html");
  } catch (error) {
    console.error("Falha ao criar pedido demonstrativo.", error);
    showFeedback(error?.message?.includes("FunctionsHttpError")
      ? "Não foi possível enviar o e-mail. Confira a configuração da integração e tente novamente."
      : (error?.message || "Não foi possível concluir o pedido demonstrativo. Sua sacola foi mantida."));
    submitButton.disabled = false;
    submitButton.innerHTML = 'Revisar e confirmar pedido <span aria-hidden="true">→</span>';
  }
});
