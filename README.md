# HackUTA Monorepo

This repo is the core of HackUTA comprising of all the packages and sites that run the technical backend.

## How to get started

1. Install NodeJS v20+ [NodeJS 22](https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi)
2. Install pnpm [pnpm Install Docs](https://pnpm.io/installation)
3. Run `pnpm install` from the **ROOT** of the project
4. Collect the needed `.env.local` from someone who has it, ask in the tech chat
5. Read the [README](./supabase/README.md) in the `supabase` folder to configure the remote supabase db. *(Only one person ever needs to do this, don't do it if someone else has)*
6. Begin Development!

## What's inside?

This Repository includes the following packages/apps:

### Apps and Packages

- `apps/admin`: a [Next.js](https://nextjs.org/) app designed for use by the organizers and super-admins of the organization
- `apps/auth`: another [Next.js](https://nextjs.org/) app that handles any and all authentication to the supabase project
- `apps/discord-bot`: a [Discord.js](https://discord.js.org/) app that allows discord users to claim their temporary passwords if needed
- `apps/frontpage`: another [Next.js](https://nextjs.org/) app that presents the frontpage of [HackUTA](https://hackuta.org)
- `apps/portal`: another [Next.js](https://nextjs.org/) app that presents a uniform portal interface to the hackers
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`) *`packages/eslint-config`*
- `@repo/tailwind-config`: `tailwind` configurations. **CURRENTLY UNUSED, NEED TO FIX THIS** *`packages/tailwind-config`*
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo *`packages/typescript-config`*
- `@repo/supabase`: the core of the database management using supabase *`packages/supabase`*
- `@repo/qr`: a uniform library for qr based connections and content scanning in a single package *`packages/qr`*

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/). *Except for the discord-bot... it's pure Javascript*

## The Todo List:

- ~~QR Code Management `@repo/qr`?~~
- Better User Management - **WIP (v1)**
- ~~User Dashboard `portal`~~
- Organizer Tools - **WIP (v1ish)**
- Schedule Manager
- ~~Announcements/Messages? `@repo/amqp`?~~
- ~~Updates to the Auth Platform~~
- ~~Submission Management?~~
- Anything else? Ask Dominic/Muhammad/Kevin
