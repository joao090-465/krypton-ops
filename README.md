# Krypton Ops // Cyber Security Platform

Sistema de página única (SPA) estático e seguro integrado à infraestrutura de Nuvem e Banco de Dados Não-Relacional do **Google Firebase**.

## 🛠️ Arquitetura do Projeto
- **Front-end:** HTML5 semântico estruturado para mitigar quebras de contexto.
- **Design System:** Tailwind CSS v4 injetado via Engine JIT em tempo de execução no cliente.
- **Back-end & DB:** Cloud Firestore (NoSQL) provido sob regras de segurança estritas.
- **Auth:** Firebase Identity Management para validação de sessões via tokens JWT.

## 🛡️ Camadas Ofensivas Aplicadas (Hardening Básica)
1. **Sem Banco Local:** Reduz a zero vetores clássicos de injeção direta SQL (*SQL Injection*).
2. **Back-end Serverless:** A lógica de leitura é protegida diretamente pelas regras de segurança de escrita/leitura (*Security Rules/RLS*) do Firebase.
3. **SPA Fixed Window:** Bloqueio de rolagem (`overflow: hidden`) montando a interface em camadas de telas dinâmicas no DOM para emular consoles corporativos.

## 🚀 Como Executar Localmente ou Produção
Para evitar erros de carregamento CORS devido ao protocolo `file:///`, use servidores locais:
```bash
# Se tiver Python instalado
python -m http.server 8080
```
Acesse `http://localhost:8080`.
