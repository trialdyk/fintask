# Fintask

A unified personal finance tracker and task management app built with **Nuxt 4**, **Nuxt UI**, and **Supabase**.

## Features

- 💰 **Financial Tracking** — Record income, expenses, transfers, and balance corrections across multiple wallets and currencies (IDR / USD).
- ✅ **Task Management** — Create, prioritize, and organize daily tasks with categories, deadlines, and tags.
- 📊 **Insights & Analytics** — Interactive ApexCharts visualizations: monthly trends, category & subcategory breakdowns, wallet balance distribution, and side-by-side month comparisons with auto-generated text insights.
- 🗂️ **Transaction History** — Detailed transaction log with advanced filtering (wallet, type, category, subcategory, date range) and pagination.
- 🌗 **Dark Mode** — Full dark mode support across all pages and charts.
- 🔐 **Authentication** — Secure login and session management via Supabase Auth.

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | [Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org) |
| UI       | [Nuxt UI v4](https://ui.nuxt.com)                       |
| Styling  | [Tailwind CSS v4](https://tailwindcss.com)              |
| Database | [Supabase](https://supabase.com) (PostgreSQL)           |
| Backend  | Nuxt Server Routes (Nitro)                              |
| Charts   | [ApexCharts](https://apexcharts.com) + vue3-apexcharts  |
| Auth     | [@nuxtjs/supabase](https://supabase.nuxtjs.org/)        |
| State    | [Pinia](https://pinia.vuejs.org)                        |
| Runtime  | [Bun](https://bun.sh) / Node.js                         |

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js ≥ 18
- A [Supabase](https://supabase.com) project database

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/trialdyk/fintask.git
cd fintask
bun install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

### 3. Start the Nuxt dev server

```bash
bun dev
```

The app will be available at **http://localhost:5173**.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `bun dev`         | Start development server |
| `bun run build`   | Build for production     |
| `bun run preview` | Preview production build |

## Project Structure

```
fintask/
├── app/
│   ├── components/       # Vue components (statistics/, etc.)
│   ├── composables/      # Shared composables (useInsights, etc.)
│   ├── layouts/          # App layouts (dashboard.vue)
│   ├── pages/            # File-based routing
│   │   ├── index.vue     # Login / landing page
│   │   └── dashboard/    # Dashboard pages
│   ├── plugins/          # Nuxt plugins (apexcharts, etc.)
│   ├── stores/           # Pinia stores (auth)
│   └── utils/            # Utility functions (currency, etc.)
├── server/
│   ├── api/              # API endpoints for CRUD operations (Supabase)
│   └── utils/            # Server utilities (supabase client, text, etc.)
├── public/               # Static assets (favicon.svg)
├── nuxt.config.ts
└── package.json
```

## License

[Apache 2.0](./LICENSE)
