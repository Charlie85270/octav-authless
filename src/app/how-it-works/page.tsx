"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Coins,
  Download,
  Wallet,
  ArrowLeftRight,
  LayoutDashboard,
  MessageSquare,
  ExternalLink,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const endpoints = [
  { name: "Portfolio", path: "GET /v1/portfolio", cost: "1 credit", note: "Per address" },
  { name: "NAV", path: "GET /v1/nav", cost: "1 credit", note: "Per address" },
  { name: "Transactions", path: "GET /v1/transactions", cost: "1 credit", note: "Per page (max 250 txs)" },
  { name: "Token Overview", path: "GET /v1/token-overview", cost: "1 credit", note: "Per address" },
  { name: "Historical", path: "GET /v1/historical", cost: "1 credit", note: "Per address" },
  { name: "Sync Transactions", path: "POST /v1/sync-transactions", cost: "1 credit + indexing", note: "+1 per 250 new txs" },
  { name: "Status", path: "GET /v1/status", cost: "Free", note: "" },
  { name: "Credits", path: "GET /v1/credits", cost: "Free", note: "" },
];

const faqs = [
  {
    q: "How much does one credit cost?",
    a: "One API credit costs $0.025 (2.5 cents). You can purchase credits at data.octav.fi.",
  },
  {
    q: "Are there any free API calls?",
    a: "Yes. Checking your credit balance (/credits) and sync status (/status) are completely free and don't consume credits.",
  },
  {
    q: "How does transaction syncing work?",
    a: "When you sync transactions for the first time, Octav indexes all historical transactions for your address. This costs 1 credit for the API call plus 1 credit per 250 transactions indexed. Subsequent syncs only index new transactions since the last sync, so they are much cheaper.",
  },
  {
    q: "How much does the initial sync cost for a new wallet?",
    a: "It depends on your transaction count. For example: 10,000 transactions costs ~41 credits ($1.03). 100 new transactions on a subsequent sync costs just 2 credits ($0.05).",
  },
  {
    q: "Is there a transaction limit?",
    a: "Addresses with more than 100,000 transactions are not indexed by the Octav API.",
  },
  {
    q: "How does CSV export work?",
    a: "Export fetches all your transactions (250 per page, 1 credit per page) and converts them into a CSV format compatible with your chosen tax platform. A wallet with 1,000 transactions would cost 4 credits to export.",
  },
  {
    q: "Which blockchains are supported?",
    a: "Octav supports 20+ blockchains including Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, Solana, and more.",
  },
  {
    q: "Is my API key stored securely?",
    a: "Your API key is stored locally in your browser's localStorage. It is never sent to any server other than the Octav API. All API calls are made directly from your browser.",
  },
  {
    q: "Which tax platforms are supported for export?",
    a: "Koinly, CoinTracker, CoinLedger, TaxBit, TokenTax, Accointing, ZenLedger, Crypto Tax Calculator, Tres Finance, and Cryptio.",
  },
  {
    q: "Do I need to sync before viewing transactions?",
    a: "Yes. Transactions must be synced (indexed) first from the Dashboard using the 'Sync Txns' button. Once synced, you can view and export them from the Transactions page.",
  },
];

export default function HowItWorksPage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">How it works</h1>
          <p className="mt-1 text-muted-foreground">
            Everything you need to know about Octav Authless
          </p>
        </div>

        {/* What is this tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              What is Octav Authless?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Octav Authless is a client-side crypto portfolio tracker and tax export tool powered by the{" "}
              <a href="https://octav.fi" target="_blank" rel="noreferrer" className="text-foreground underline">
                Octav API
              </a>
              . It lets you:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Portfolio Dashboard</p>
                  <p className="text-xs">View NAV, holdings, and DeFi protocol positions across 20+ chains</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Transaction History</p>
                  <p className="text-xs">Browse, filter, and paginate through all your on-chain transactions</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Tax CSV Export</p>
                  <p className="text-xs">Export to 10 tax platforms: Koinly, CoinTracker, CoinLedger, TaxBit, and more</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">AI Chat</p>
                  <p className="text-xs">Ask questions about your portfolio using OpenAI or Anthropic</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Octav Authless runs <strong className="text-foreground">entirely in your browser</strong>. There is no backend server.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>API keys are stored in localStorage, never sent to any third-party server</li>
              <li>All API calls go directly from your browser to the Octav API</li>
              <li>CSV files are generated client-side and downloaded directly</li>
              <li>AI chat calls go directly to OpenAI/Anthropic from your browser</li>
            </ul>
          </CardContent>
        </Card>

        {/* Credits & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              API Credits & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The Octav API uses a <strong className="text-foreground">pay-per-use credit system</strong>.
                Each credit costs <strong className="text-foreground">$0.025</strong> (2.5 cents).
              </p>
              <p>
                Get your API key and purchase credits at{" "}
                <a
                  href="https://data.octav.fi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-foreground underline"
                >
                  data.octav.fi
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep.name}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{ep.name}</span>
                        <p className="font-mono text-[10px] text-muted-foreground">{ep.path}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ep.cost === "Free" ? "secondary" : "outline"}>
                        {ep.cost}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ep.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">Sync cost examples</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                <li>Initial sync (10,000 txs): ~41 credits ($1.03)</li>
                <li>Subsequent sync (100 new txs): 2 credits ($0.05)</li>
                <li>No new activity: 1 credit ($0.025)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Supported chains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Supported Chains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Ethereum", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche",
                "BSC", "Fantom", "Solana", "Gnosis", "zkSync", "Linea", "Scroll",
                "Blast", "Mantle", "Manta", "Mode", "Zora", "Cronos", "Moonbeam",
              ].map((chain) => (
                <Badge key={chain} variant="secondary">{chain}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong className="text-foreground">Get an API key</strong> — Sign up at{" "}
                <a href="https://data.octav.fi" target="_blank" rel="noreferrer" className="underline">
                  data.octav.fi
                </a>{" "}
                and purchase credits
              </li>
              <li>
                <strong className="text-foreground">Add your wallet address</strong> — EVM (0x...) or Solana
              </li>
              <li>
                <strong className="text-foreground">Sync your data</strong> — Use "Sync Portfolio" and "Sync Txns" on the Dashboard
              </li>
              <li>
                <strong className="text-foreground">View & export</strong> — Browse transactions, then export CSV for your tax platform
              </li>
            </ol>
          </CardContent>
        </Card>

        <Separator />

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">FAQ</h2>
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
