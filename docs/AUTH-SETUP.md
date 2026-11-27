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
