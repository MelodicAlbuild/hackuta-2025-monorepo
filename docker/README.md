Dockerized services for HackUTA 2025

Services
- rabbitmq: Management UI on http://localhost:15672 (guest/guest)
- websocket-server: Exposes ws on ws://localhost:8080
- discord-bot: Headless service (requires tokens)

Quick start
1) Create an env file next to compose.yml with values:

   SUPABASE_JWT_SECRET=... 
   DISCORD_TOKEN=...
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...

2) Build and start:

   docker compose -f docker/compose.yml up --build -d

3) View logs:

   docker compose -f docker/compose.yml logs -f websocket-server
   docker compose -f docker/compose.yml logs -f discord-bot

Notes
- Images are built via turbo prune + pnpm for small runtime images.
- The discord bot has `disabled=true` in code; set to false to enable.
