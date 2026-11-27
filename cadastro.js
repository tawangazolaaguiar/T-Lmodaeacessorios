import { supabase, appUrl } from "./supabase-client.js";

const form = document.querySelector("#registration-form");
const feedback = document.querySelector("#registration-feedback");
const submitButton = document.querySelector("#registration-submit");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("field-error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("");

  const fullName = document.querySelector("#registration-name").value.trim();
  const email = document.querySelector("#registration-email").value.trim();
  const password = document.querySelector("#registration-password").value;
  const passwordConfirm = document.querySelector("#registration-password-confirm").value;
  const marketingOptIn = form.elements.marketing.checked;

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

  submitButton.disabled = true;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: appUrl("login.html"),
      data: { full_name: fullName, marketing_opt_in: marketingOptIn }
    }
  });
  submitButton.disabled = false;

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
});
