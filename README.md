<p align="center">
  <h1 align="center">webcli</h1>
  <p align="center">
    <strong>Secure, agent-driven web data extraction.</strong><br>
    Turn any website into structured data. No browser required.
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> &bull;
    <a href="#built-in-adapters">Adapters</a> &bull;
    <a href="#mcp-server">MCP Server</a> &bull;
    <a href="#architecture">Architecture</a> &bull;
    <a href="#security">Security</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square" alt="Node.js 20+">
  <img src="https://img.shields.io/badge/tests-87%20passing-brightgreen?style=flat-square" alt="87 tests passing">
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="Apache 2.0">
  <img src="https://img.shields.io/badge/MCP-compatible-purple?style=flat-square" alt="MCP compatible">
</p>

---

<p align="center">
  <img src="assets/demo-overview.gif" alt="webcli demo - searching HackerNews, fetching crypto prices, and querying Bluesky" width="700">
</p>

## What is webcli?

webcli extracts structured data from websites using an **API-first approach** -- it tries public APIs, RSS feeds, and structured HTML before ever touching a browser. Built for AI agents that need to read the web.

**How it compares to opencli:**

| | opencli | webcli |
|---|---|---|
| **Browser** | Reuses your Chrome session | No browser needed for most sites |
| **Anti-detection** | Patches navigator.webdriver, fakes fingerprints | Honest automation, no evasion |
| **Extension** | God-mode Chrome extension (debugger + cookies + all URLs) | No extension at all |
| **Security** | Arbitrary JS in your browser context | Sandboxed V8 isolates, domain-locked fetch |
| **Agent interface** | CLI only | CLI + MCP server |
| **Auth** | Steals your cookies | You provide API keys explicitly |

## Quick Start

```bash
# Clone and install
git clone https://github.com/ashark-ai-05/webcli.git
cd webcli
npm install

# List available adapters
npx tsx src/main.ts list

# Search Hacker News
npx tsx src/main.ts run hackernews search -a query=AI -a limit=5

# Get live crypto prices
npx tsx src/main.ts run coingecko prices -a coins=bitcoin,ethereum,solana

# Search Bluesky users
npx tsx src/main.ts run bluesky search -a query=typescript -a limit=5
```

## Built-in Adapters

### Hacker News

<img src="assets/demo-search.gif" alt="Searching Hacker News" width="700">

```bash
# Search stories
webcli run hackernews search -a query=rust -a limit=10

# Output as JSON (for piping to other tools)
webcli run hackernews search -a query=rust -f json

# Output as CSV (for spreadsheets)
webcli run hackernews search -a query=rust -f csv
```

### CoinGecko

<img src="assets/demo-crypto.gif" alt="Live cryptocurrency prices" width="700">

```bash
# Live prices
webcli run coingecko prices -a coins=bitcoin,ethereum,solana

# Trending coins
webcli run coingecko trending -a limit=10
```

### Bluesky

```bash
# Search users
webcli run bluesky search -a query=developer -a limit=5

# Get a profile
webcli run bluesky profile -a handle=bsky.app
```

## MCP Server

webcli runs as an [MCP](https://modelcontextprotocol.io) server so AI agents (Claude, Cursor, etc.) can use it as a tool.

```bash
# Start MCP server
npx tsx src/main.ts --mcp
```

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "webcli": {
      "command": "npx",
      "args": ["tsx", "/path/to/webcli/src/main.ts", "--mcp"]
    }
  }
}
```

**Available MCP tools:**

| Tool | Description |
|------|-------------|
| `webcli_run` | Run any adapter -- extract data from a website |
| `webcli_list` | List all available adapters |
| `webcli_schema` | Get the data schema of an adapter (field names, types, roles) |

An agent can discover what data a site provides (`webcli_schema`), then extract it (`webcli_run`) -- all without any hardcoded knowledge of the site.

## YAML Adapter DSL

Every data source is defined as a declarative YAML adapter. Here's the CoinGecko prices adapter:

```yaml
site: coingecko
name: prices
description: Live cryptocurrency prices
version: 1

source:
  type: api
  base_url: https://api.coingecko.com/api/v3
  auth: none
  rate_limit: { requests: 30, per: 60 }

args:
  coins: { type: string, default: "bitcoin,ethereum" }
  currency: { type: string, default: usd }

schema:
  type: price_feed
  entity: cryptocurrency
  fields:
    id: { role: id }
    price: { role: value, unit: currency }
    change_24h: { role: delta }
    market_cap: { role: metric }
  update_frequency: "~60s"

pipeline:
  - fetch:
      url: /simple/price
      params:
        ids: "${{ args.coins }}"
        vs_currencies: "${{ args.currency }}"
        include_market_cap: true
        include_24hr_change: true
  - transform: |
      Object.entries(data).map(([id, v]) => ({
        id, price: v[args.currency],
        change_24h: v[args.currency + '_24h_change'].toFixed(2) + '%',
        market_cap: v[args.currency + '_market_cap']
      }))

columns: [id, price, change_24h, market_cap]
```

### Pipeline Steps

| Step | Purpose | Example |
|------|---------|---------|
| `fetch` | HTTP request | `fetch: { url: /api/data, params: { q: "${{ args.query }}" } }` |
| `select` | Extract nested key | `select: response.data.items` |
| `transform` | JS in sandboxed V8 | `transform: "data.map(x => ({ ...x, rank: x.score * 2 }))"` |
| `map` | Reshape each item | `map: { title: "${{ item.name }}", score: "${{ item.points }}" }` |
| `filter` | Keep matching items | `filter: "item.score > 10"` |
| `sort` | Order results | `sort: { field: score, order: desc }` |
| `limit` | Cap result count | `limit: "${{ args.limit }}"` |
| `dedupe` | Remove duplicates | `dedupe: id` |
| `flatten` | Flatten nested arrays | `flatten: tags` |

## Architecture

```
                    ┌─────────┐   ┌────────────┐
                    │   CLI   │   │ MCP Server │
                    └────┬────┘   └─────┬──────┘
                         └───────┬──────┘
                                 v
                    ┌────────────────────────┐
                    │      Core Engine       │
                    │  Pipeline Executor     │
                    │  Adapter Registry      │
                    │  Rate Limiter          │
                    └───────────┬────────────┘
                                v
              ┌─────────────────────────────────┐
              │        Extractor Cascade        │
              │  HTTP/API > RSS > HTML > Browser│
              └─────────────────────────────────┘
                                v
              ┌─────────────────────────────────┐
              │       Discovery Engine          │
              │  Schema Inference               │
              │  Known Site Registry (8 sites)  │
              │  Field Role Detection           │
              └─────────────────────────────────┘
                                v
              ┌─────────────────────────────────┐
              │          Data Layer             │
              │  Snapshot Store + Diff Engine   │
              │  Subscription Manager           │
              │  Adaptive Interval Scheduler    │
              └─────────────────────────────────┘
```

### Extractor Cascade

webcli tries the lightest extraction method first:

1. **HTTP/API** -- Direct JSON API calls. No browser. Fastest.
2. **RSS/Atom** -- Feed parsing. Perfect for news sites.
3. **HTML** -- JSON-LD, structured data, DOM pattern detection.
4. **Browser** -- Playwright (sandboxed). Last resort for SPAs.

90% of useful data is accessible without a browser.

### Discovery Engine

Point webcli at any URL and it figures out the data model:

- **Known Site Registry** -- 8 major sites with pre-mapped APIs (CoinGecko, HN, Bluesky, Reddit, StackOverflow, GitHub, X, Wikipedia)
- **Schema Inference** -- Detects field roles (id, title, url, timestamp, score, price, author) from field names and values
- **Entity Typing** -- Classifies data as articles, posts, prices, users, etc.

## Security

webcli was designed as a secure alternative to tools like opencli. Every layer has explicit security boundaries:

### Sandboxed Expressions

The `${{ }}` template engine and `transform` step run in **isolated V8 contexts** via `vm.createContext`:

```
Available:  args, item, index, data, Math, Date, JSON, String, Array, Object
BLOCKED:    fetch, require, import, process, globalThis, eval, Function,
            setTimeout, Buffer, fs, child_process
```

Memory limit: 64MB. Time limit: 5s for transforms, 1s for expressions.

### Domain-Locked Fetch

The `fetch` pipeline step only makes requests to URLs matching the adapter's declared `source.base_url`. A CoinGecko adapter cannot make requests to Twitter's API.

### Adapter Validation

Every adapter is validated before execution:
- Max 20 pipeline steps
- Only known step types allowed
- Source type and auth method must be from allowed lists
- No shell commands anywhere in the pipeline

### Rate Limiting

Global and per-site token-bucket rate limiting prevents accidental DoS:

```yaml
rate_limits:
  global: { max_requests_per_minute: 120 }
  per_site:
    default: { max_requests_per_minute: 30 }
    overrides:
      api.coingecko.com: 50
```

### Honest Automation

No anti-detection. No fingerprint faking. No `navigator.webdriver` patching. webcli identifies itself honestly:

```
User-Agent: webcli/0.1.0 (+https://github.com/webcli)
```

If a site blocks us, we escalate gracefully (try browser, then auth, then report blocked) -- we don't start an evasion arms race.

## Output Formats

```bash
# Pretty table (default)
webcli run hackernews search -a query=AI

# JSON (for piping to jq, agents, scripts)
webcli run hackernews search -a query=AI -f json

# CSV (for spreadsheets, pandas)
webcli run hackernews search -a query=AI -f csv
```

## Data Layer

### Snapshots & Diffs

webcli can track changes over time:

```typescript
// Snapshot store saves results to ~/.webcli/data/{site}/{name}/
// Diff engine compares snapshots to detect added/removed/changed items
{
  "added": [{ "id": "solana", "price": 142.50 }],
  "removed": [],
  "changed": [{
    "id": "bitcoin",
    "fields": { "price": { "old": 71000, "new": 71250 } }
  }],
  "unchanged_count": 1
}
```

### Adaptive Polling

Subscriptions automatically adjust their polling frequency:

- **High volatility** (>50% data changed) -- halve the interval
- **Moderate activity** (10-50% changed) -- keep current interval
- **No changes** -- increase interval by 50%

Respects `min_interval` and `max_interval` bounds, plus `update_frequency` hints from the adapter schema.

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Type check
npm run lint

# Run the CLI in dev mode
npm run dev -- list
```

### Project Structure

```
webcli/
  src/
    core/           # Pipeline engine, types, adapter system
    extractors/     # HTTP, RSS, HTML, cascade
    discovery/      # Schema inference, known sites
    data/           # Snapshots, diffs, subscriptions
    scheduler/      # Adaptive intervals
    interfaces/     # CLI (commander) + MCP server
    utils/          # Config, logging
  adapters/         # Built-in YAML adapters
  tests/e2e/        # End-to-end tests (hit live APIs)
```

## Writing Custom Adapters

Create a YAML file in `~/.webcli/adapters/{site}/{name}.yaml`:

```yaml
site: mysite
name: feed
description: My custom feed
version: 1
created_by: manual

source:
  type: api
  base_url: https://api.mysite.com
  auth: none

args:
  limit: { type: number, default: 10 }

schema:
  type: feed
  entity: article
  fields:
    title: { role: title }
    url: { role: url }

pipeline:
  - fetch: { url: /posts, params: { limit: "${{ args.limit }}" } }
  - select: data
  - map:
      title: "${{ item.title }}"
      url: "${{ item.url }}"
      date: "${{ item.published_at }}"
  - limit: "${{ args.limit }}"

columns: [title, url, date]
```

Validate it:

```bash
webcli validate ~/.webcli/adapters/mysite/feed.yaml
```

Then use it:

```bash
webcli run mysite feed -a limit=5
```

## License

Apache-2.0
