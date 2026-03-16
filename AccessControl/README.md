# AccessControl

School biometric access control system — monorepo.

## Structure

```
AccessControl/
├── AccessControl.slnx              # .NET solution
├── docker-compose.yml              # Local dev environment
├── backend/
│   ├── src/
│   │   └── AccessControl.API/      # ASP.NET Core Web API
│   │       ├── Controllers/        # API controllers
│   │       ├── DTOs/               # Data transfer objects
│   │       ├── Models/             # Domain models
│   │       ├── Services/           # Business service interfaces & implementations
│   │       ├── Data/               # EF Core DbContext & migrations
│   │       ├── Program.cs
│   │       └── appsettings.json
│   └── tests/
│       └── AccessControl.Tests/    # xUnit test project
└── frontend/
    ├── src/
    │   ├── components/             # Reusable UI components
    │   ├── pages/                  # Route-level page components
    │   ├── services/               # API client helpers
    │   ├── App.tsx
    │   └── main.tsx
    ├── vite.config.ts
    └── package.json
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 24+](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/)

## Getting Started

### Run with Docker Compose

```bash
cd AccessControl
docker compose up --build
```

- API → http://localhost:5000
- Swagger → http://localhost:5000/swagger
- Frontend → http://localhost:5173

### Run locally (without Docker)

**Backend:**

```bash
cd AccessControl
dotnet run --project backend/src/AccessControl.API
```

**Frontend:**

```bash
cd AccessControl/frontend
npm install
npm run dev
```

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Backend   | ASP.NET Core 10, Entity Framework Core |
| Frontend  | React 19, TypeScript, Vite         |
| Database  | SQL Server 2022                    |
| Container | Docker / Docker Compose            |
