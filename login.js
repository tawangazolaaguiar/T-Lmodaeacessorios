import { supabase, appUrl } from "./supabase-client.js";

const form = document.querySelector("#login-form");
const feedback = document.querySelector("#login-feedback");
const submitButton = document.querySelector("#login-submit");
const forgotPassword = document.querySelector("#forgot-password");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("field-error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("");
  submitButton.disabled = true;

  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  submitButton.disabled = false;
  if (error) {
    showFeedback("Não foi possível entrar. Confira seu e-mail e senha e, se necessário, confirme seu e-mail.", true);
    console.error("Falha no login:", error.message);
    return;
  }
  window.location.assign(appUrl("minha-conta.html"));
});

forgotPassword.addEventListener("click", async (event) => {
  event.preventDefault();
  showFeedback("");
  const email = document.querySelector("#login-email").value.trim();
  if (!email) {
    showFeedback("Informe seu e-mail acima para receber o link de recuperação.", true);
    document.querySelector("#login-email").focus();
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl("redefinir-senha.html")
  });
  if (error) {
    showFeedback("Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.", true);
    console.error("Falha ao solicitar recuperação:", error.message);
    return;
  }
  showFeedback("Se existir uma conta para esse e-mail, enviaremos as instruções de recuperação.");
});
