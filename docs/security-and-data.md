# Security and data handling

## Security baseline
Wafflr is designed for quick, account-free guest participation. A room code helps people find a room but is not an authorization credential. Sensitive actions must be validated by a trusted server or database function, and each exposed Supabase table must have explicit Row Level Security policies.

The client may receive only the Supabase project URL and public anon/publishable key. The service-role key bypasses RLS and must remain server-side. Do not commit secrets, paste credentials into issues, or log access tokens or private room payloads.

## Roles and phase enforcement
The eventual backend must distinguish host and guest capabilities using a trustworthy room-scoped identity/credential design. Do not trust a client-supplied role, host flag, room phase, vote total, or option count. Enforce host-only controls, contribution/edit windows, deck locking, ballot validation, confirmation, tie resolution, and expiry on the server/database boundary.

Realtime broadcasts should reflect authorized state changes; they do not replace authorization checks. Ensure guests cannot read or mutate data outside the rooms they are authorized to access.

## Data minimization and retention
Avoid requiring accounts for guests. Do not collect real names unless a future, explicit product decision justifies them. Avoid retaining precise venue/location data beyond what a room needs. Closed room data is retained for up to 24 hours for the user's room history and then deleted; only anonymous aggregate analytics may remain. Define and test cleanup behavior before production launch.

## Current status
The current web app is a local prototype. No live Supabase project, production credentials, RLS policies, or database migrations are assumed to exist merely because this repository includes Supabase planning documentation.
