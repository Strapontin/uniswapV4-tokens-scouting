# Pool Initialize Viewer

A small Next.js app for browsing Uniswap v4 pool initialization logs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/poolInitialize](http://localhost:3000/poolInitialize).

The app reads matching `pool_initialize_logs_*.json` files and token metadata
from `data/`. Select a token on `/poolInitialize` to view its complete JSON log
at `/poolInitialize/<address>`.

## Checks

```bash
npm run lint
npm run build
```
