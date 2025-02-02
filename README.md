# AutoMagik UI

<p align="center">
  <img src=".github/images/automagik_logo.png" alt="AutoMagik Logo" width="600"/>
</p>

Because magic shouldn't be complicated.

AutoMagik UI is a friendly interface for [AutoMagik](https://github.com/namastexlabs/automagik) but also more! This is a full-fledged application to manage agentic apps.

Use the AutoMagik agent to sync with Langflow and manage AutoMagik Workflows. Create agents with custom prompts, memories, and tools.
Let agents schedule tasks on Automagik using Workflows as tools.

## Setup locally

1. Clone the repository and install dependencies:

```
git clone https://github.com/namastexlabs/automagik-ui.git
cd automagik-ui && pnpm install
```

2.You will need to create a `.env` and use the environment variables [defined in `.env.example`](.env.example).

3. For now, only PostgreSQL database is required but this will change on `0.1.0` with the AutoMagik integration.

### Setup database

Run the existing migrations and run `update-tools` to create the necessary internal tools.

```
pnpm db:migrate
pnpm db:update-tools
```

### Development
```bash
pnpm dev
```

The app should now be running on [localhost:3000](http://localhost:3000/).
