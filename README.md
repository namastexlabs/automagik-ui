# AutoMagik UI

<p align="center">
  <img src=".github/images/automagik_logo.png" alt="AutoMagik Logo" width="600"/>
</p>

Because magic shouldn't be complicated.

AutoMagik UI is a friendly interface for [AutoMagik](https://github.com/namastexlabs/automagik) but also more! This is a full-fledged application to manage agentic apps.

Use the AutoMagik agent to sync with Langflow and manage AutoMagik Workflows. Create agents with custom prompts, memories, and tools.
Let agents schedule tasks on Automagik using Workflows as tools.

## Setup locally

Requirements:
* PostgreSQL
* Node.js preferably v20+
* pnpm
* AutoMagik API

Clone the repository and install dependencies:

```bash
git clone https://github.com/namastexlabs/automagik-ui.git
cd automagik-ui && pnpm install
```

Copy `.env.example` to `.env` and use the necessary environment variables.

```bash
cp .env.example .env
```

### Setup database

Run the existing migrations and `update-tools` to upsert default tools.

```bash
pnpm db:migrate && pnpm db:update-tools
```

### Development

```bash
pnpm dev
```

The app should now be running on [localhost:3000](http://localhost:3000/).
