import { supabase, appUrl } from "./supabase-client.js";

const form = document.querySelector("#reset-form");
const feedback = document.querySelector("#reset-feedback");
const submit = document.querySelector("#reset-submit");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.classList.remove("field-error");
  const password = document.querySelector("#new-password").value;
  const confirmation = document.querySelector("#confirm-password").value;

  if (password.length < 8 || password !== confirmation) {
    feedback.textContent = password !== confirmation
      ? "As senhas não coincidem."
      : "A senha precisa ter pelo menos 8 caracteres.";
    feedback.classList.add("field-error");
    return;
  }

  submit.disabled = true;
  const { error } = await supabase.auth.updateUser({ password });
  submit.disabled = false;

  if (error) {
    feedback.textContent = "O link pode ter expirado. Solicite uma nova recuperação de senha.";
    feedback.classList.add("field-error");
    console.error("Falha ao redefinir senha:", error.message);
    return;
  }

  feedback.textContent = "Senha atualizada com sucesso! Redirecionando para sua conta…";
  window.setTimeout(() => window.location.assign(appUrl("minha-conta.html")), 1000);
});
