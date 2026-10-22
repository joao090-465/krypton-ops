# Krypton Ops: onde o ataque morre.

Site institucional de cibersegurança com loja de produtos, painel administrativo secreto, gráficos financeiros em tempo real e banco de clientes. É um site estático (HTML, JavaScript e Firebase), sem etapa de build.

## Estrutura

```
index.html            página principal (Início, Produtos, Login e Painel)
js/app.js             lógica do site e do painel
js/firebase-config.js SUA configuração do Firebase (editar)
logo.svg, favicon.svg identidade visual
vercel.json           cabeçalhos de segurança e configuração da Vercel
firestore.rules       regras do banco (copiar para o Firebase)
```

## Passo a passo

### 1. Firebase
1. Em https://console.firebase.google.com, crie um projeto.
2. **Authentication > Método de login**: ative **E-mail/senha** e crie o seu usuário administrador.
3. **Firestore Database**: crie o banco e, na aba **Regras**, cole o conteúdo de `firestore.rules` e publique.
4. **Configurações do projeto > Seus apps > Web (`</>`)**: copie a configuração e cole em `js/firebase-config.js`.
5. **Authentication > Configurações > Domínios autorizados**: adicione `krypton-ops.vercel.app`.

### 2. Publicar na Vercel (corrige o erro 404)
O erro `404: NOT_FOUND` acontece quando o `index.html` não está na **raiz** do repositório. Faça assim:

1. Descompacte o `.zip`.
2. Envie para o GitHub **o conteúdo da pasta** (index.html, js, vercel.json...), e não a pasta que contém tudo.
3. Na Vercel, em **Settings > General**, deixe **Root Directory** vazio e **Framework Preset** em `Other`. Deixe Build Command e Output Directory em branco.
4. Faça um novo deploy.

### 3. Acessar o painel
O painel não tem link no site. Acesse `seu-dominio/#/krypton-admin` e entre com o usuário criado no Firebase.

- **Financeiro**: receita bruta, dívidas, saldo líquido, retorno por tipo de investimento (gráficos em tempo real).
- **Produtos**: o que você cria aparece na hora na página de Produtos.
- **Clientes**: banco de contatos. Os pedidos do formulário do site também caem aqui.

## WhatsApp
O número e o nome ficam no começo de `js/app.js` (`const WA = "5534996514968"`). Para trocar, altere esse valor com DDI + DDD + número.

## Segurança
- Login com Firebase Authentication e regras de acesso no Firestore.
- Cabeçalhos HTTP (CSP, HSTS, X-Frame-Options, entre outros) definidos no `vercel.json`.
- Conteúdo dinâmico inserido como texto, o que evita XSS.
- Formulário com campo anti-robô e intervalo entre envios.
- Se algum recurso externo for bloqueado depois que você adicionar bibliotecas novas, ajuste a linha `Content-Security-Policy` do `vercel.json`.

## Identidade
Logo: hexágono com **X** em gradiente magenta, violeta e ciano. Bordão: **"Onde o ataque morre."**
