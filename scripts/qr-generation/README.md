# QR Generation Scripts

This folder contains tooling to generate PNG QR codes for general admission, volunteers, admins, and super-admins.

## Setup

1. Ensure the following environment variables are available (the script also reads `.env.local`):
   - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Install dependencies if needed:

```cmd
pnpm install
```

## Generating QR Code PNGs

Run the helper script via pnpm:

```cmd
pnpm run qr:generate -- --count 500 --volunteers ./scripts/volunteer-emails.txt
```

### Options

- `--count <n>` – Number of general-purpose QR tokens to generate (default `500`).
- `--out <dir>` / `--output <dir>` – Custom output directory. Defaults to `scripts/qr-generation/output/run-<timestamp>`.
- `--volunteers <file>` – Path to a newline-delimited list of volunteer email addresses. The script pulls matching QR tokens from Supabase and creates PNGs per volunteer.
- `--no-general` – Skip generating general QR code PNGs.
- `--no-admins` – Skip admin/super-admin PNGs.
- `--no-volunteers` – Skip volunteer PNGs even if an email file is provided.

### Output

Each run produces a timestamped folder (unless you specify `--out`):

- `general/`
  - `png/` – A `{token}-qr.png` for each generated general QR code.
  - `general-tokens.csv` – Tokens with index for reference.
  - `general-tokens.json` – Raw token list.
- `admins/` – `{email}-{role}-qr.png` images for every admin and super-admin with a QR token.
- `volunteers/` – `{email}-{role}-qr.png` images for volunteer emails supplied via the file.
- `summary.json` – Run metadata (counts and file paths).

The script prefers `sign_up_token` values when available and falls back to `qr_token` for each profile.

Missing emails or QR tokens are logged as warnings so you can update Supabase as needed.
