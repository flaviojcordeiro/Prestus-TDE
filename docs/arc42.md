# arc42 — Prestus

## 1. Introdução e Objetivos
Plataforma que conecta estabelecimentos a profissionais temporários. Objetivos:
- Cadastro e busca de vagas.
- Reserva de profissionais.
- Integração com notificações e pagamentos.

## 2. Restrições
- Uso de bancos gerenciados (MongoDB Atlas, Azure SQL 1 DTU).
- Deploy local orquestrado via Docker Compose.
- Publicação obrigatória de repositório e imagens Docker.

## 3. Contexto e Escopo
- Público alvo: gestores e trabalhadores temporários.
- Frontend consome API única do BFF.
- Sistemas externos: MongoDB Atlas, Azure SQL, Azure Functions.

## 4. Solução
- Microserviço de vagas (Node.js + MongoDB).
- Microserviço de reservas (Node.js + Azure SQL).
- BFF Gateway (Node.js) agregando dados e expondo endpoints REST.
- Functions (pagamento e notificações) disparadas por eventos do BFF.
- Microfrontend (React) renderizando dashboard integrado.

## 5. Decisões Arquiteturais
- **A1**: Separar domínios (vagas/reservas) em microserviços especializados.
- **A2**: Persistir notificações em MongoDB para reuso entre service e function.
- **A3**: Expor endpoint agregado `/api/dashboard` para reduzir round-trips no frontend.
- **A4**: Utilizar Atlas e Azure SQL para atender requisito de bancos gerenciados e heterogêneos.

## 6. Estrutura de Building Blocks
- Package `microservice-jobs`: rotas `/jobs` com driver MongoDB.
- Package `microservice-bookings`: rotas `/bookings` com driver `mssql`.
- Package `bff-gateway`: rotas `/api/*` e orquestração com `axios`.
- Package `function-notification`: HTTP Trigger (GET/POST) persistindo em MongoDB.
- Package `function-payment`: HTTP Trigger (POST) retornando aprovação.
- Package `microfrontend`: tela React consumindo `/api/dashboard`.

## 7. Runtime Scenarios
1. **Reserva de vaga**
   - Frontend chama `POST /api/bookings`.
   - BFF cria reserva no Azure SQL, dispara pagamento e grava notificação via function.
   - BFF retorna detalhes da reserva.
2. **Carregamento do dashboard**
   - Frontend chama `GET /api/dashboard`.
   - BFF agrega dados do MongoDB (jobs), Azure SQL (bookings) e function (notifications).

## 8. Deploy
- Contêineres Docker para cada microserviço/function/frontend.
- `docker-compose.yml` realiza build e inclui variáveis de ambiente para Atlas/Azure SQL.
- Imagens publicadas no Docker Hub conforme requisito.

## 9. Qualidade
- Observabilidade via logs padrão das aplicações Node.js/Azure Functions.
- Resiliência: drivers configurados com pools e reconexão automática.
- Segurança: credenciais mantidas fora do controle de versão (`.env`).

## 10. Riscos & Debt
- Dependência de conectividade estável com serviços gerenciados.
- Necessidade de pipeline automatizado não implementado (dívida técnica).

## 11. Glossário
- **BFF**: Backend for Frontend.
- **Atlas**: serviço gerenciado do MongoDB.
- **Azure SQL**: banco relacional gerenciado pela Microsoft.
