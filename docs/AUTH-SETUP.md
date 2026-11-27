# Configuração de autenticação da L&A

## 1. Banco de dados
No painel do Supabase, abra **SQL Editor**, crie uma consulta e execute o conteúdo de:
`supabase/migrations/001_profiles.sql`.

A tabela `public.profiles` usa Row Level Security (RLS). Cada cliente pode ler e atualizar somente o próprio perfil. O perfil inicial é criado por um trigger quando a conta de autenticação é criada.

## 2. URLs de autenticação
No Supabase, abra **Authentication → URL Configuration** e configure:

- Site URL: `https://tawangazolaaguiar.github.io/T-Lmodaeacessorios/`
- Redirect URLs: `https://tawangazolaaguiar.github.io/T-Lmodaeacessorios/**`

A confirmação de e-mail deve permanecer habilitada para o fluxo recomendado.

## 3. Chave pública
A URL do projeto e a chave Publishable são usadas no arquivo `supabase-client.js`. A chave Publishable pode ser exposta no navegador; nunca coloque neste repositório uma chave Secret, `service_role` ou senha do banco.

## 4. Publicação
O site usa GitHub Pages. Depois de revisar e integrar a branch de autenticação, aguarde a publicação do Pages e teste cadastro, confirmação de e-mail, login, recuperação de senha e logout.

## Observação
Esta etapa implementa autenticação e perfil básico. Não implementa ainda pagamentos, pedidos reais, permissões administrativas ou integrações financeiras.
