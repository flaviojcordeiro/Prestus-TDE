# Prestus Monorepo

Este repositório reúne os principais componentes da plataforma Prestus seguindo a arquitetura descrita no arc42:

- **Microservices**: serviços independentes para vagas (`microservice-jobs`) e reservas (`microservice-bookings`).
- **Functions**: funções serverless para pagamentos (`function-payment`) e notificações (`function-notification`).
- **BFF (Backend for Frontend)**: gateway Node.js que orquestra integrações entre microservices e functions (`bff-gateway`).
- **Microfrontend**: aplicação React (Vite) responsável pela experiência do usuário (`microfrontend`).

## Pré-requisitos

- Conta no **MongoDB Atlas** com cluster free tier configurado
- Banco **Azure SQL Database (1 DTU)** e firewall liberado para o IP público utilizado
- Docker Desktop 4+
- Node.js 18+ (opcional, para rodar localmente cada pacote)
- Azure Functions Core Tools 4 (opcional, para executar as functions sem Docker)

Crie o arquivo `.env` na raiz a partir de `.env.example` preenchendo as credenciais do Atlas e Azure SQL. Atualize também os arquivos `.env` de cada pacote conforme necessário.

## Como executar com Docker

```powershell
# na raiz do projeto
docker-compose up --build
```

Serviços disponíveis após o `up`:

- BFF Gateway: http://localhost:3000
- Microservice Jobs: http://localhost:3001/jobs
- Microservice Bookings: http://localhost:3002/bookings
- Function Payment: http://localhost:7071/api/process-payment
- Function Notification: http://localhost:7072/api/send-notification
- Microfrontend: http://localhost:8080
- Dashboard agregado (BFF): http://localhost:3000/api/dashboard

Para parar e remover os containers:

```powershell
docker-compose down
```

> ⚠️ Certifique-se de liberar o IP público das máquinas que executarão o `docker-compose` na firewall do Atlas e do Azure SQL.

## Execução individual (opcional)

Cada pacote possui scripts NPM padrão. Exemplo para o microservice de vagas:

```powershell
cd microservice-jobs
cp .env.example .env
npm install
npm run dev
```

Os serviços expõem variáveis em `.env.example` para facilitar a configuração local. Para o microservice de reservas configure os valores `SQL_*` com o Azure SQL; para o microservice de vagas e para a function de notificações configure `MONGODB_*` apontando para o Atlas.

Para o microfrontend, copie `.env.example` para `.env` e ajuste `VITE_API_BASE_URL` conforme necessário:

```powershell
cd microfrontend
cp .env.example .env
npm install
npm run dev -- --host
```

## Estrutura de pastas

```text
bff-gateway/
function-notification/
function-payment/
microfrontend/
microservice-bookings/
microservice-jobs/
```

Consulte cada subpasta para mais detalhes de configuração.

## Publicação no GitHub

1. Crie um repositório público no GitHub (ex.: `prestus-monorepo`).
2. No terminal da raiz do projeto:

	```powershell
	git init
	git add .
	git commit -m "chore: initial architecture"
	git branch -M main
	git remote add origin https://github.com/<usuario>/<repositorio>.git
	git push -u origin main
	```

3. Registre a URL pública do repositório para informar na entrega (`https://github.com/<usuario>/<repositorio>`).
4. Atualize `docs/ava-entrega.md` com a URL e os nomes dos alunos.

## Publicação das imagens no Docker Hub

1. Faça login no Docker Hub: `docker login`.
2. Para cada serviço a ser publicado (jobs, bookings, bff) execute:

	```powershell
	docker build -t <usuario>/prestus-<servico>:v1 ./<pasta-do-servico>
	docker push <usuario>/prestus-<servico>:v1
	```

	Exemplos de nomes de serviço: `jobs`, `bookings`, `bff`.
3. Após o push, anote as URLs das imagens (`https://hub.docker.com/r/<usuario>/prestus-<servico>`) para informar no relatório de entrega (`docs/ava-entrega.md`).

## Endpoints principais do BFF

- `GET /api/jobs` – proxy para o microservice de vagas (MongoDB Atlas)
- `POST /api/jobs` – cria vaga no MongoDB via microservice
- `GET /api/bookings` – proxy para o microservice de reservas (Azure SQL)
- `POST /api/bookings` – cria reserva no Azure SQL e aciona as functions
- `GET /api/notifications` – consulta notificações persistidas pela Azure Function
- `POST /api/notifications` – cria notificação via Azure Function (persistindo em MongoDB)
- `GET /api/dashboard` – agrega vagas, reservas e notificações em uma única resposta
