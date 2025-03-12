# AutoMagik UI

<p align="center">
  <img src=".github/images/automagik_logo.png" alt="AutoMagik Logo" width="600"/>
</p>

> **Because magic shouldn't be complicated.**

AutoMagik UI is not just a friendly interface for [AutoMagik](https://github.com/namastexlabs/automagik) — it's a full-fledged application for managing agentic apps with elegance and simplicity.

## ✨ Features

- **Seamless Integration**: Connect directly with your AutoMagik instance
- **Agent Management**: Create and manage AI agents with custom prompts, memories, and tools
- **Workflow Orchestration**: Let agents schedule tasks using AutoMagik Workflows as tools
- **LangFlow Synchronization**: Automatically sync with your LangFlow instances
- **Intuitive Interface**: User-friendly design for both beginners and experts

## 🚀 Getting Started

### Prerequisites

- **PostgreSQL**: Database for storing application data
- **Node.js**: Preferably v20 or newer
- **pnpm**: Package manager for JavaScript
- **AutoMagik API**: Running instance of the AutoMagik backend

### Installation

1. **Clone the repository and install dependencies**:

```bash
git clone https://github.com/namastexlabs/automagik-ui.git
cd automagik-ui && pnpm install
```

2. **Configure environment variables**:

```bash
cp .env.example .env
```

Edit `.env` to add your specific configuration values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `AUTOMAGIK_API_URL`: URL to your AutoMagik API instance
- `NEXT_PUBLIC_APP_URL`: Public URL for your UI application

### 🗄️ Database Setup

Run the existing migrations and update the default tools:

```bash
# Apply database migrations
pnpm db:migrate

# Upsert default tools
pnpm db:update-tools
```

### 💻 Development

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000/).

### 🏗️ Production Build

Create an optimized production build:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## 🔧 Configuration Options

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `AUTOMAGIK_API_URL` | URL to your AutoMagik API | `http://localhost:8888` |
| `NEXT_PUBLIC_APP_URL` | Public URL for the UI | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | - |

## 🧩 Workflows

With AutoMagik UI, you can:

1. **Create agents** with customized capabilities
2. **Design workflows** that connect to your LangFlow instances
3. **Schedule tasks** to run automatically or on-demand
4. **Monitor executions** through a comprehensive dashboard

## 🔍 Key Screens

- **Dashboard**: Overview of all your agents and workflows
- **Agent Creator**: Visual builder for creating custom agents
- **Workflow Manager**: Connect and organize your automation flows
- **Execution Monitor**: Track the status of all running tasks
- **Tool Library**: Browse and configure available tools

## 📚 Documentation

For more detailed documentation, visit the [AutoMagik Documentation](https://github.com/namastexlabs/automagik/wiki).

---

<p align="center">
  <b>Part of the AutoMagik Ecosystem</b><br>
  <a href="https://github.com/namastexlabs/automagik">AutoMagik</a> |
  <a href="https://github.com/namastexlabs/automagik-agents">AutoMagik Agents</a> |
  <a href="https://github.com/namastexlabs/automagik-ui">AutoMagik UI</a>
</p>
