# Notes

## How to run

Write the steps to start your project here.

## Requirements

Write anything that needs to be installed or set up first (for example a database, a Node or Python version, environment variables).

# Sneaker Drop - Flash Sale Engine

**Loom Video Walkthrough:** [https://www.loom.com/share/b2319abff9e24fe4937e7015b21484ec]

# Sneaker Drop - Flash Sale Engine

A thread-safe, high-concurrency backend built in Go paired with a React/Vite frontend to handle limited-stock flash sales without race conditions or overselling.

## System Architecture & Features

- **Concurrency Control**: State mutated inside `store/` is protected via `sync.Mutex` locks to prevent race conditions during simultaneous requests.
- **Auto-Expiration & Queue Handoff**: Holds auto-expire after 5 minutes using asynchronous `time.AfterFunc` timers. Expired holds automatically reassign to the first user in the FIFO waiting queue (`WaitingQueue`).
- **Webhook Idempotency**: Payment processing checks transaction IDs against a `CompletedPayments` map to ignore duplicate or late payment webhooks safely.
- **User Limits**: Strictly enforces maximum 1 active hold and maximum 2 total pair purchases per user.

## Requirements

- Go 1.21+
- Node.js 18+

## How to Run Locally

### 1. Start Backend Server

```bash
cd backend
go run main.go
```

Backend runs on http://localhost:8080

### 2. Start Frontend Console

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (proxies /api requests to port 8080)

## API Endpoints

`GET /api/status?user_id=<id>:` Fetches stock, timer countdown, and line position.

`POST /api/buy:` Atomically requests a 5-minute hold or enters the waiting line.

`POST /api/webhook/payment:` Simulates payment hook (handles duplicates & late completions).

### Test

```bash
for i in {1..30}; do curl -s -X POST http://localhost:8080/api/buy -H "Content-Type: application/json" -d "{\"user_id\":\"user_$i\"}" & done; wait
```
