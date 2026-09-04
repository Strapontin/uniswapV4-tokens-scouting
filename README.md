# UniswapV4 Interactions with viem

This project is a minimal TypeScript + viem setup for interacting with EVM networks.

## Add new token:

### Run python script

`make py TOKEN=0xaddr`

### Fetch tokens name

`make findtokennames`

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

You can override the RPC and chain by creating a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

The app connects to Ethereum mainnet by default and fetches the latest block number plus the ETH balance of a wallet address.

## Pool Initialize Viewer

The `pool-initialize-viewer/` app browses Uniswap v4 pool initialization logs and
token metadata from its `data/` directory.

```bash
make viewer-install
make viewer-dev
```

Open [http://localhost:3000/poolInitialize](http://localhost:3000/poolInitialize)
to browse token names, symbols, addresses, and their JSON event data.
