# Prestus - Visão de Arquitetura

## Componentes

- `microservice-jobs`: API Node.js conectada ao **MongoDB Atlas** para CRUD de vagas temporárias.
- `microservice-bookings`: API Node.js conectada ao **Azure SQL Database (1 DTU)** para gerenciamento de reservas.
- `function-payment`: Azure Function HTTP utilizada para orquestrar o fluxo financeiro da reserva.
- `function-notification`: Azure Function HTTP que persiste notificações no MongoDB e as disponibiliza via GET.
- `bff-gateway`: Backend-for-Frontend que faz proxy dos CRUDs, agrega dados (microservices + functions) e coordena os eventos.
- `microfrontend`: Aplicação React (Vite) consumindo o BFF.

## Fluxo principal

1. Usuário acessa o microfrontend em `http://localhost:8080`.
2. A aplicação chama o BFF (`http://localhost:3000/api`).
3. O BFF executa CRUDs em dois domínios distintos:
   - Vagas: `microservice-jobs` (MongoDB Atlas).
   - Reservas: `microservice-bookings` (Azure SQL).
4. No `POST /api/bookings` o BFF dispara eventos:
   - `function-payment` para processar o pagamento.
   - `function-notification` para persistir/entregar notificações.
5. O endpoint `GET /api/dashboard` agrega vagas, reservas e notificações em uma única resposta para o microfrontend.

## Dados e persistência

- **MongoDB Atlas**: coleções `jobs` e `notifications` compartilhadas entre o microservice e a function.
- **Azure SQL**: tabela `Bookings` armazenando as reservas com UUID primário.
- As credenciais são definidas por variáveis de ambiente (`.env`).

## Deploy local

O arquivo `docker-compose.yml` realiza o build de cada componente e injeta as variáveis de ambiente necessárias para Atlas e Azure SQL, permitindo a execução integrada no ambiente local.
