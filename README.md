# Fintask

A unified personal finance tracker and task management app built with **Nuxt 4**, **Nuxt UI**, and **SpacetimeDB**.

## Features

- 💰 **Financial Tracking** — Record income, expenses, transfers, and balance corrections across multiple wallets and currencies (IDR / USD).
- ✅ **Task Management** — Create, prioritize, and organize daily tasks with categories, deadlines, and tags.
- 📊 **Statistics & Charts** — Interactive ApexCharts visualizations: monthly trends, category breakdowns, wallet distribution, and top transactions.
- 🌗 **Dark Mode** — Full dark mode support across all pages and charts.
- 🔐 **Authentication** — OIDC-based login via SpacetimeDB Auth.

## Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Frontend | [Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org)    |
| UI       | [Nuxt UI v4](https://ui.nuxt.com)                          |
| Styling  | [Tailwind CSS v4](https://tailwindcss.com)                 |
| Database | [SpacetimeDB](https://spacetimedb.com) (TypeScript SDK)    |
| Charts   | [ApexCharts](https://apexcharts.com) + vue3-apexcharts     |
| Auth     | [oidc-client-ts](https://github.com/authts/oidc-client-ts) |
| State    | [Pinia](https://pinia.vuejs.org)                           |
| Runtime  | [Bun](https://bun.sh) / Node.js                            |

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js ≥ 18
- [SpacetimeDB CLI](https://spacetimedb.com/install) (`spacetime` command)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/trialdyk/fintask.git
cd fintask
bun install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SPACETIMEDB_DB_NAME=your-db-name
VITE_SPACETIMEDB_HOST=https://maincloud.spacetimedb.com
VITE_SPACETIME_CLIENT_ID=your-client-id
```

### 3. Start SpacetimeDB (local development)

```bash
# Publish the module to your local SpacetimeDB instance
spacetime publish --module-path spacetimedb --server local

# Start the local SpacetimeDB server
spacetime dev
```

### 4. Start the Nuxt dev server

```bash
bun dev
```

The app will be available at **http://localhost:5173**.

## Scripts

| Command                           | Description                              |
| --------------------------------- | ---------------------------------------- |
| `bun dev`                         | Start development server                 |
| `bun run build`                   | Build for production                     |
| `bun run preview`                 | Preview production build                 |
| `bun run spacetime:generate`      | Generate TypeScript bindings from schema |
| `bun run spacetime:publish`       | Publish module to SpacetimeDB maincloud  |
| `bun run spacetime:publish:local` | Publish module to local SpacetimeDB      |

## Project Structure

```
fintask/
├── app/
│   ├── components/       # Vue components (statistics/, etc.)
│   ├── composables/      # Shared composables (useStatistics, etc.)
│   ├── layouts/          # App layouts (dashboard.vue)
│   ├── pages/            # File-based routing
│   │   ├── index.vue     # Login / landing page
│   │   └── dashboard/    # Dashboard pages
│   ├── plugins/          # Nuxt plugins (apexcharts, etc.)
│   ├── stores/           # Pinia stores (auth)
│   └── utils/            # Utility functions (currency, etc.)
├── spacetimedb/
│   └── src/              # SpacetimeDB module (schema & reducers)
├── src/
│   └── module_bindings/  # Auto-generated SpacetimeDB bindings
├── public/               # Static assets (favicon.svg)
├── nuxt.config.ts
└── package.json
```

## License

[Apache 2.0](./LICENSE)
