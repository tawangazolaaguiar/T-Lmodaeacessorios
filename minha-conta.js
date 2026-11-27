import { supabase, appUrl } from "./supabase-client.js";

const intro = document.querySelector("#account-intro");
const feedback = document.querySelector("#account-feedback");
const logoutButton = document.querySelector("#logout-button");

async function loadAccount() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    window.location.replace(appUrl("login.html"));
    return;
  }

  document.querySelector("#account-email").textContent = user.email || "—";
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    intro.textContent = "Sua sessão está ativa, mas não foi possível carregar o perfil.";
    feedback.textContent = "Verifique se a migração do banco de dados foi executada no Supabase.";
    feedback.classList.add("field-error");
    console.error("Falha ao carregar perfil:", error.message);
    return;
  }

  document.querySelector("#account-name").textContent = profile?.full_name || "Cliente L&A";
  document.querySelector("#account-created").textContent = profile?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(profile.created_at))
    : "—";
  intro.textContent = "Que bom ter você por aqui!";
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    feedback.textContent = "Não foi possível encerrar a sessão. Tente novamente.";
    feedback.classList.add("field-error");
    logoutButton.disabled = false;
    console.error("Falha ao sair:", error.message);
    return;
  }
  window.location.assign(appUrl("index.html"));
});

loadAccount();
