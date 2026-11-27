import { supabase } from "./supabase-client.js";
async function fillSavedCustomerData() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return;
  const { data: profile, error } = await supabase.from("profiles")
    .select("full_name, postal_code, state, street, street_number, complement, neighborhood, city")
    .eq("id", user.id).maybeSingle();
  if (error || !profile) { console.warn("Não foi possível carregar o endereço salvo.", error?.message); return; }
  const fields = {
    "#customer-name": profile.full_name, "#customer-email": user.email,
    "#customer-cep": profile.postal_code, "#customer-state": profile.state,
    "#customer-street": profile.street, "#customer-number": profile.street_number,
    "#customer-complement": profile.complement, "#customer-neighborhood": profile.neighborhood,
    "#customer-city": profile.city
  };
  for (const [selector, value] of Object.entries(fields)) {
    const input = document.querySelector(selector);
    if (input && value && !input.value) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  if (profile.postal_code && typeof window.LA_CHECKOUT_REFRESH_ADDRESS === "function") window.LA_CHECKOUT_REFRESH_ADDRESS();
}
fillSavedCustomerData();