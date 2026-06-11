# AegisRadar Frontend

Real-time fraud detection dashboard built with React 18 + TypeScript.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **TailwindCSS** + **shadcn/ui** — Styling and components
- **Zustand** + **Immer** — Global state management
- **TanStack Query** — REST data fetching and caching
- **@microsoft/signalr** — Real-time WebSocket connection
- **Recharts** — Charts and data visualization
- **date-fns** — Date formatting

## Getting Started

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:5099
VITE_SIGNALR_URL=http://localhost:5099/hubs/fraud-alerts
```

```bash
# Start development server
npm run dev
```

Open http://localhost:5173

## Demo Login

```
Email:    demo@aegisradar.io
Password: Demo@1234
```

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing page |
| Login | `/login` | JWT authentication |
| Register | `/register` | Merchant registration |
| Dashboard | `/dashboard` | Live overview + charts |
| Transactions | `/dashboard/transactions` | Table + Approve/Block |
| Alerts | `/dashboard/alerts` | Real-time alerts |
| Profile | `/dashboard/profile` | Merchant profile |

## Real-time Architecture

```
Worker (every 8s) → Kafka → AI API → SignalR
                                        ↓
                              useSignalR hook
                                        ↓
                              Zustand store update
                                        ↓
                              React components re-render
```

SignalR events:
- `TransactionUpdated` → updates transaction feed + charts
- `FraudAlertReceived` → adds alert to panel

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SIGNALR_URL` | SignalR hub URL |
