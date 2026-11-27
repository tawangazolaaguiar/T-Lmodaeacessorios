const form = document.querySelector("#login-form");
const feedback = document.querySelector("#login-feedback");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent = "O login ainda não está disponível: falta conectar o site a um serviço seguro de autenticação.";
});