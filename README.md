# Octav Authless

A fully client-side crypto portfolio tracker and tax export tool powered by the [Octav API](https://octav.fi). No backend, no database, no auth — just paste your API key and wallet addresses and start exploring.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Portfolio Dashboard** — View holdings across 20+ blockchains with DeFi protocol positions (Aave, Spark, Pendle, Hyperliquid, etc.)
- **Transaction History** — Browse, filter, and search transactions by chain, type, and date range
- **Tax CSV Export** — Export to 10 tax platforms: Koinly, CoinTracker, CoinLedger, TaxBit, TokenTax, Accointing, ZenLedger, Crypto Tax Calculator, Tres Finance, Cryptio
- **AI Chat Assistant** — Ask questions about your portfolio using OpenAI or Anthropic with streaming responses and token usage tracking
- **Multi-Wallet** — Track multiple EVM and Solana wallets, switch between them instantly
- **Fully Responsive** — Works on desktop, tablet, and mobile
- **Dark Mode** — System-aware theme switching
- **Zero Backend** — Everything runs in the browser. API keys and wallet addresses are stored in localStorage only.

## How It Works

```
Browser (Next.js client)
    │
    ├── Octav API (api.octav.fi/v1)
    │     ├── Portfolio & DeFi positions
    │     ├── Transaction history
    │     ├── Wallet balances & NAV
    │     ├── Sync status & credits
    │     └── Token overview & historical snapshots
    │
    └── AI Provider (optional)
          ├── OpenAI API
          └── Anthropic API
```

The app calls the Octav API directly from the browser using your API key. No server-side routes, no proxying, no data stored anywhere except your browser's localStorage.

## Getting Started

### 1. Get an Octav API Key

Sign up at [octav.fi](https://octav.fi) and grab your API key from the dashboard.

### 2. Install & Run

```bash
git clone https://github.com/Charlie85270/octav-authless.git
cd octav-authless
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the onboarding flow will guide you through entering your API key and wallet addresses.

### 3. Optional: AI Chat

To enable the AI assistant, go to **Settings** and add your OpenAI or Anthropic API key. The assistant can answer questions about your portfolio using the Octav data as context.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Portfolio overview
│   ├── transactions/       # Transaction list & export
│   ├── onboarding/         # First-time setup wizard
│   ├── settings/           # API keys & wallet management
│   └── how-it-works/       # Help page
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # AppShell, Header, Sidebar
│   ├── chat/               # AI chat panel (global floating)
│   ├── transactions/       # Table, filters, export dialog
│   └── dashboard/          # Credit balance, sync status
├── hooks/                  # React Query hooks for Octav API
├── lib/
│   ├── octav-client.ts     # Octav API client
│   ├── ai-client.ts        # OpenAI / Anthropic streaming
│   └── csv-export/         # Tax platform CSV formatters
├── stores/                 # Zustand stores (persisted to localStorage)
└── types/                  # TypeScript definitions
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| State | Zustand (local), TanStack Query (server) |
| Tables | TanStack Table |
| Icons | Lucide React |
| Notifications | Sonner |
| Theming | next-themes |

## Tax Export Platforms

Each platform has a dedicated CSV formatter that maps Octav transaction data to the platform's expected format:

| Platform | Columns | Notes |
|----------|---------|-------|
| Koinly | Date, Sent Amount/Currency, Received Amount/Currency, Fee Amount/Currency, Net Worth, Label, Description, TxHash | Universal format |
| CoinTracker | Date, Type, Received Quantity/Currency, Sent Quantity/Currency, Fee Amount/Currency | Simple format |
| CoinLedger | Date, Platform, Asset Sent/Received, Fee, Type, Description, TxHash | Platform field = protocol name |
| TaxBit | Date and Time, Transaction Type, Sent/Received Quantity and Asset, Fee, Exchange/Wallet, ID | Full detail |
| TokenTax | Type, BuyAmount/Currency, SellAmount/Currency, FeeAmount/Currency, Exchange, Group, Comment, Date | Trade-focused |
| + 5 more | ... | See `src/lib/csv-export/` |

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

## License

MIT
