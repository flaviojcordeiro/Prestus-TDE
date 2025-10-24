# Software Architecture Canvas — Prestus

## 1. Contexto
- Plataforma para conectar estabelecimentos a trabalhadores temporários.
- Usuários acessam via microfrontend web.

## 2. Requisitos Funcionais
- Manter catálogo de vagas (CRUD completo).
- Registrar reservas de trabalhadores para vagas.
- Processar pagamento da reserva.
- Enviar e consultar notificações relacionadas às reservas.
- Oferecer endpoint agregado (`/api/dashboard`) com visão unificada.

## 3. Requisitos Não Funcionais
- Separação em microserviços independentes.
- Uso de bancos gerenciados (MongoDB Atlas, Azure SQL).
- Deploy local via Docker Compose.
- APIs documentadas e acessíveis via BFF.

## 4. Componentes Principais
- **Microfrontend (React + Vite)**: interface do usuário.
- **BFF Gateway (Node.js Express)**: orquestração, agregação e proxy de serviços.
- **Microservice Jobs (Node.js + MongoDB)**: CRUD de vagas.
- **Microservice Bookings (Node.js + Azure SQL)**: CRUD de reservas.
- **Function Notification (Azure Functions + MongoDB)**: gravação e listagem de notificações.
- **Function Payment (Azure Functions)**: simulação de pagamento.

## 5. Dados
- `jobs` (MongoDB): vagas cadastradas.
- `notifications` (MongoDB): notificações de reservas.
- `Bookings` (Azure SQL): reservas, estados e metadados.

## 6. Interfaces Externas
- MongoDB Atlas (driver oficial Node.js).
- Azure SQL Database (driver `mssql`).
- Azure Functions HTTP Trigger.

## 7. Qualidade & Riscos
- Risco de latência entre containers e bancos na nuvem → mitigar liberando firewall e observando métricas.
- Garantir segurança das credenciais `.env` (não versionar).
- Monitorar retomada de conexão ao utilizar drivers (`mongodb`, `mssql`).

## 8. Roadmap
- Adicionar autenticação e perfis de usuário.
- Automatizar CI/CD para build & push no Docker Hub e GitHub Actions.
- Instrumentar logs e métricas para monitoramento das funções.
