import { supabase, appUrl } from "./supabase-client.js";

const loginLink = document.querySelector(".login-nav-link");
if (loginLink) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    loginLink.textContent = session?.user ? "Minha conta" : "Login / Cadastre-se";
    loginLink.href = session?.user ? appUrl("minha-conta.html") : appUrl("login.html");
  });
}
