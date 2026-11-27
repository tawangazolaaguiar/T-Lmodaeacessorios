# Configuração de autenticação da L&A

## Banco de dados
A migração inicial `001_profiles.sql` já foi executada. Execute também `002_profile_address.sql` no Editor SQL do Supabase para adicionar os campos de endereço.

## URLs
URL do site: `https://tawangazolaaguiar.github.io/T-Lmodaeacessorios/`
URLs de redirecionamento: `https://tawangazolaaguiar.github.io/T-Lmodaeacessorios/**`

## Endereço
O cadastro solicita CEP, UF, rua/avenida, número, complemento, bairro e cidade. O ViaCEP preenche os dados disponíveis. O endereço é salvo em `public.profiles` e carregado no checkout quando o cliente está conectado.

## Segurança e limites
A chave Publishable pode estar no frontend. Nunca exponha chave Secret, `service_role` ou senha do banco. O checkout continua sendo uma demonstração: pagamentos, pedidos reais e integrações financeiras ainda não foram implementados.


## Checkout demonstrativo e confirmação
Quando o cliente está conectado, o checkout recupera o e-mail da sessão Supabase e os dados disponíveis em `public.profiles`. Os campos podem ser conferidos/ajustados no checkout; o e-mail da conta conectada é usado como destinatário de referência. Para visitante, são usados os dados digitados no formulário.

A página de confirmação monta um número de pedido e um comprovante fictícios, além de uma prévia do e-mail com produtos, valores e endereço. Nesta etapa os dados ficam somente em `sessionStorage` no navegador: não há gravação de pedidos no banco nem envio real de e-mail.

O comprovante deve exibir claramente **SEM VALOR FISCAL — NÃO É NOTA FISCAL ELETRÔNICA**. Não usar CNPJ, chave de acesso ou QR Code fiscal fictícios.

Para habilitar e-mail real futuramente, será necessário configurar um serviço server-side (por exemplo, Supabase Edge Function + Resend), guardar a chave do serviço apenas nos Secrets do Supabase e verificar um domínio de envio. Nunca colocar a chave de API no JavaScript público ou no GitHub Pages.
