import { supabase, appUrl } from "./supabase-client.js";

const form = document.querySelector("#registration-form");
const feedback = document.querySelector("#registration-feedback");
const submitButton = document.querySelector("#registration-submit");
const cepInput = document.querySelector("#registration-cep");
const cepStatus = document.querySelector("#registration-cep-status");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("field-error", isError);
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

    document.querySelector("#registration-street").value = address.logradouro || "";
    document.querySelector("#registration-neighborhood").value = address.bairro || "";
    document.querySelector("#registration-city").value = address.localidade || "";
    document.querySelector("#registration-state").value = address.uf || "";
    cepStatus.textContent = "Endereço localizado. Confira os dados e informe o número e complemento.";
    cepStatus.classList.remove("field-error");
  } catch (error) {
    console.error("Não foi possível consultar o CEP.", error);
    cepStatus.textContent = "Não foi possível consultar este CEP. Preencha o endereço manualmente.";
    cepStatus.classList.add("field-error");
  }
}

cepInput.addEventListener("input", () => {
  cepInput.setCustomValidity("");
  cepStatus.textContent = "Digite o CEP para localizar o endereço.";
  cepStatus.classList.remove("field-error");
});
cepInput.addEventListener("blur", lookupAddress);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("");

  const value = (selector) => document.querySelector(selector).value.trim();
  const fullName = value("#registration-name");
  const email = value("#registration-email");
  const password = document.querySelector("#registration-password").value;
  const passwordConfirm = document.querySelector("#registration-password-confirm").value;
  const marketingOptIn = form.elements.marketing.checked;
  const postalCode = value("#registration-cep").replace(/\D/g, "");
  const state = value("#registration-state").toUpperCase();
  const street = value("#registration-street");
  const streetNumber = value("#registration-number");
  const complement = value("#registration-complement");
  const neighborhood = value("#registration-neighborhood");
  const city = value("#registration-city");

  if (fullName.length < 2) {
    showFeedback("Informe seu nome completo.", true);
    return;
  }
  if (password.length < 8) {
    showFeedback("Sua senha precisa ter pelo menos 8 caracteres.", true);
    return;
  }
  if (password !== passwordConfirm) {
    showFeedback("As senhas não coincidem. Confira e tente novamente.", true);
    return;
  }
  if (!/^\d{8}$/.test(postalCode)) {
    showFeedback("Informe um CEP válido com 8 números.", true);
    cepInput.focus();
    return;
  }
  if (!/^[A-Z]{2}$/.test(state)) {
    showFeedback("Informe uma UF válida com duas letras.", true);
    document.querySelector("#registration-state").focus();
    return;
  }

  submitButton.disabled = true;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: appUrl("login.html"),
        data: {
          full_name: fullName,
          marketing_opt_in: marketingOptIn,
          postal_code: postalCode,
          state,
          street,
          street_number: streetNumber,
          complement,
          neighborhood,
          city
        }
      }
    });

    if (error) {
      showFeedback("Não foi possível criar a conta. Confira os dados ou tente novamente mais tarde.", true);
      console.error("Falha no cadastro:", error.message);
      return;
    }

    if (data.session) {
      showFeedback("Conta criada com sucesso! Estamos levando você à sua área de cliente.");
      window.setTimeout(() => window.location.assign(appUrl("minha-conta.html")), 900);
      return;
    }

    form.reset();
    showFeedback("Cadastro iniciado! Confira sua caixa de entrada e confirme seu e-mail para ativar a conta.");
  } catch (error) {
    showFeedback("Ocorreu um erro ao criar sua conta. Tente novamente.", true);
    console.error("Falha inesperada no cadastro:", error);
  } finally {
    submitButton.disabled = false;
  }
});
