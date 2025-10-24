# Prestus — C4 Model

## Context (C1)

- **Usuário Prestus** interage com o **Microfrontend** para consultar vagas e confirmar reservas.
- O **Microfrontend** consome o **BFF Gateway** via HTTP.
- O **BFF Gateway** conversa com:
  - **Microservice Jobs** (CRUD de vagas).
  - **Microservice Bookings** (CRUD de reservas).
  - **Function Notification** (persistência e entrega de notificações).
  - **Function Payment** (processamento de pagamentos).
- Sistemas externos gerenciados na nuvem:
  - **MongoDB Atlas** (coleções `jobs` e `notifications`).
  - **Azure SQL Database** (tabela `Bookings`).

## Container (C2)

| Container | Tecnologia | Responsabilidade | Persistência |
|-----------|------------|------------------|--------------|
| Microfrontend | React + Vite | UI e fluxo do usuário | - |
| BFF Gateway | Node.js (Express) | Orquestração, agregação, API única | - |
| Microservice Jobs | Node.js (Express) | CRUD vagas | MongoDB Atlas |
| Microservice Bookings | Node.js (Express) | CRUD reservas | Azure SQL |
| Function Notification | Azure Functions (Node.js) | Persistir e listar notificações | MongoDB Atlas |
| Function Payment | Azure Functions (Node.js) | Simular autorização financeira | (sem persistência) |

## Component (C3) — BFF Gateway

| Endpoint | Integrações | Descrição |
|----------|--------------|-----------|
| `GET /api/jobs` | Microservice Jobs | Lista vagas do MongoDB |
| `POST /api/jobs` | Microservice Jobs | Cria vaga |
| `GET /api/bookings` | Microservice Bookings | Lista reservas do Azure SQL |
| `POST /api/bookings` | Microservice Bookings, Function Payment, Function Notification | Cria reserva e dispara eventos |
| `GET /api/notifications` | Function Notification | Lista notificações persistidas |
| `POST /api/notifications` | Function Notification | Cria notificação via Function |
| `GET /api/dashboard` | Jobs + Bookings + Notifications | Agrega dados dos dois microservices e da function |

## Deployment (C4)

```
+---------------------+         +------------------------+
| Docker Host         |         | Cloud Providers        |
|                     |         |                        |
|  - microfrontend    |  --->   |  MongoDB Atlas         |
|  - bff-gateway      |         |  Azure SQL Database    |
|  - microservice-*   |         |                        |
|  - function-*       |         +------------------------+
|
| (docker-compose)    |
+---------------------+
```

Todos os containers são orquestrados via `docker-compose`, consumindo serviços gerenciados na nuvem.
