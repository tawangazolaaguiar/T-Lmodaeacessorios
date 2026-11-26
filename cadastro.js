const form = document.querySelector("#registration-form");
const cpfInput = document.querySelector("#registration-cpf");
const cpfError = document.querySelector("#registration-cpf-error");
const cepInput = document.querySelector("#registration-cep");
const cepStatus = document.querySelector("#registration-cep-status");
const feedback = document.querySelector("#registration-feedback");
const checkoutUtils = window.LA_CHECKOUT_UTILS;

cpfInput.addEventListener("input", () => {
  cpfInput.setCustomValidity("");
  cpfError.textContent = "";
});

cpfInput.addEventListener("blur", () => {
  cpfInput.value = checkoutUtils.formatCPF(cpfInput.value);
});

cepInput.addEventListener("input", () => {
  cepInput.setCustomValidity("");
  cepStatus.textContent = "Digite o CEP para localizar o endereço.";
  cepStatus.classList.remove("field-error");
});

cepInput.addEventListener("blur", async () => {
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
    cepStatus.textContent = "Endereço localizado. Confira e complete os campos.";
  } catch (error) {
    console.error("Não foi possível consultar o CEP.", error);
    cepStatus.textContent = "Não foi possível consultar este CEP. Preencha o endereço manualmente.";
    cepStatus.classList.add("field-error");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent = "";
  cpfInput.setCustomValidity("");

  if (!checkoutUtils.isValidCPF(cpfInput.value)) {
    cpfInput.setCustomValidity("Informe um CPF válido.");
    cpfError.textContent = "Confira o CPF informado.";
    cpfInput.reportValidity();
    return;
  }

  feedback.textContent = "Os campos foram conferidos, mas o cadastro ainda não pode ser concluído: falta conectar o site a um serviço seguro de cadastro.";
});
