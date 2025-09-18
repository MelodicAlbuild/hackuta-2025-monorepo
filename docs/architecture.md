# HackUTA 2025 Monorepo Architecture

This document maps the systems, dependencies, and key request/data flows across the monorepo.

## Top-Level System
```mermaid
flowchart LR
  %% Groups
  subgraph Clients
    Browser[Users' Browsers]
    DiscordUsers[Discord Users]
  end

  subgraph "Next.js Apps"
    Frontpage[frontpage]
    Auth[auth]
    Admin[admin]
    Portal[portal]
  end

  subgraph Services
    WS[websocket-server\nNode + ws]
    DiscordBot[discord-bot\nNode + discord.js]
    RabbitMQ[(RabbitMQ\napp_events_topic)]
    Supabase[(Supabase\nAuth + Postgres + Realtime)]
  end

  subgraph Packages
    SupaPkg[@repo/supabase]
    QRPkg[@repo/qr]
  end

  %% Client -> Apps
  Browser --> Frontpage
  Browser --> Auth
  Browser --> Admin
  Browser --> Portal

  %% Shared packages used by apps
  Frontpage --> SupaPkg
  Auth --> SupaPkg
  Admin --> SupaPkg
  Portal --> SupaPkg
  Portal --> QRPkg

  %% Apps -> Supabase
  SupaPkg --> Supabase

  %% Auth redirect target
  Admin -.- "Redirect if unauthenticated" -.-> Auth
  Portal -.- "Redirect if unauthenticated" -.-> Auth

  %% Admin <-> Auth API
  Admin -- "HTTP POST /api/invite" --> Auth

  %% Realtime pipeline
  RabbitMQ -- "topic messages" --> WS
  WS == "broadcast to subscribed clients" ==> Browser
  WS -. "JWT verify with\nSUPABASE_JWT_SECRET" .-> Supabase

  %% Discord bot flows
  DiscordUsers -- "Slash Commands" --> DiscordBot
  DiscordBot --> Supabase
  DiscordBot -- "DM / Replies" --> DiscordUsers
```

## Workspace Dependency Graph
```mermaid
flowchart TD
  subgraph Apps
    A[apps/frontpage]
    B[apps/auth]
    C[apps/admin]
    D[apps/portal]
    E[apps/websocket-server]
    F[apps/discord-bot]
  end

  subgraph Packages
    P1[@repo/supabase]
    P2[@repo/qr]
    P3[@repo/tailwind-config]
    P4[@repo/eslint-config]
    P5[@repo/typescript-config]
  end

  A --> P1
  B --> P1
  C --> P1
  D --> P1
  D --> P2

  %% Dev-time configs (common but optional to visualize)
  A -.-> P3
  B -.-> P3
  C -.-> P3
  D -.-> P3
  A -.-> P4
  B -.-> P4
  C -.-> P4
  D -.-> P4
  A -.-> P5
  B -.-> P5
  C -.-> P5
  D -.-> P5
```

## Intra-App Flows

### Auth: Login + Invite
```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant MW as Auth Middleware (SSR)
  participant AuthApp as auth (Next.js)
  participant Supa as Supabase Auth

  U->>MW: Request protected route
  MW->>Supa: getSession() (refresh if needed)
  alt No session
    MW-->>U: 302 to /login
  else Has session
    MW-->>U: Proceed
  end

  Note over AuthApp,Supa: Invite endpoint
  participant AdminApp as admin (Next.js)
  AdminApp->>AuthApp: POST /api/invite { email }
  AuthApp->>Supa: validate current user via cookies
  AuthApp->>Supa: admin.inviteUserByEmail(email)
  AuthApp-->>AdminApp: 200 { message: "Invite sent" }
```

### Admin: QR Scan -> User Lookup
```mermaid
sequenceDiagram
  participant V as Volunteer/Admin UI
  participant API as admin /api/scan-qr
  participant SA as Supabase Admin Client
  participant Supa as Supabase (DB + Auth Admin)

  V->>API: POST { qr_token }
  API->>SA: createAdminClient()
  SA->>Supa: from(qr_identities).select(user_id).eq(qr_token)
  alt Not found
    API-->>V: 404 Invalid QR
  else Found user_id
    SA->>Supa: auth.admin.getUserById(user_id)
    SA->>Supa: from(profiles).select(*, points(score))
    API-->>V: 200 { user: id, email, role, score }
  end
```

### Portal: User Group + My QR
```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant MW as Portal Middleware
  participant API1 as portal /api/user-group
  participant API2 as portal /api/my-qr
  participant SSR as Supabase SSR Client
  participant Supa as Supabase

  U->>MW: Request any route
  MW->>SSR: getSession()
  alt No session
    MW-->>U: 302 to auth /login?redirect_to=...
  else Has session
    MW-->>U: Proceed
  end

  U->>API1: GET
  API1->>SSR: auth.getUser()
  API1->>Supa: from(user_groups).select(user_group).eq(user_id)
  API1-->>U: { group }

  U->>API2: GET
  API2->>SSR: auth.getUser()
  API2->>Supa: query identity/QR data as needed
  API2-->>U: image/png (generated via QRCode)
```

### WebSocket Realtime: Auth + Subscriptions
```mermaid
sequenceDiagram
  participant Client as Browser WS Client
  participant WSS as websocket-server
  participant RMQ as RabbitMQ (topic exchange)
  participant Supa as Supabase (JWT secret)

  Client->>WSS: WS upgrade ?token=<JWT>
  WSS->>Supa: jwt.verify(token, SUPABASE_JWT_SECRET)
  alt Invalid token
    WSS-->>Client: 401 Unauthorized (close)
  else Valid
    WSS-->>Client: Connection established
    Client->>WSS: { type: "subscribe", channel }
  end

  RMQ-->>WSS: message(routingKey, payload)
  WSS-->>Client: payload (if subscribed and OPEN)
```

### Discord Bot: Commands
```mermaid
sequenceDiagram
  participant DU as Discord User
  participant Discord as Discord API
  participant Bot as discord-bot
  participant Supa as Supabase (Service Key)

  DU->>Discord: /getpass | /stats | /check
  Discord->>Bot: Interaction
  alt getpass
    Bot->>Supa: profiles.select(id).eq(email)
    Bot->>Supa: temporary_passwords.select(*).eq(user_id)
    Bot->>Discord: DM temp password
    Bot->>Supa: temporary_passwords.update({ fetched_at })
  else stats (admin only)
    Bot->>Supa: temporary_passwords.count()
    Bot->>Supa: temporary_passwords.count(not fetched)
    Bot-->>Discord: Embed with counts
  else check
    Bot->>Supa: interest-form.select(id).eq(email)
    Bot-->>Discord: Registered/Not Registered
  end
```

## Notable Environment Variables
- NEXT_PUBLIC_AUTH_APP_URL: Used by admin and portal middleware to redirect to centralized auth app; also in UI links.
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: Used by @repo/supabase browser/server clients.
- SUPABASE_SERVICE_ROLE_KEY: Used by discord-bot; admin package’s server actions use admin client where needed.
- SUPABASE_JWT_SECRET: Used by websocket-server to verify JWTs on upgrade.
- RABBITMQ_URL: Used by websocket-server to connect and consume topics.

## Notes
- The websocket-server subscribes to all topics (`#`) on `app_events_topic`; clients authorize channel subscriptions per-user (`user.<uuid>`) or `public.*` as implemented.
- The `@repo/qr` package is declared and consumed by `portal`, intended for QR generation helpers. Some QR generation in admin uses `qrcode` directly.
- All Next.js apps share Supabase SSR helpers provided by `@repo/supabase` for consistent auth/session behavior.
