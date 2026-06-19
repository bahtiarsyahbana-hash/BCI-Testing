# BCI Claims Management

Local claims management app for broker claim tracking.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   `npm install`

2. Create local environment settings:

   `cp .env.example .env`

3. Run the app:

   `npm run dev`

By default, the app can use a local SQLite database at `data/app.db` and store uploaded documents in `uploads/`.
Set `DATABASE_PROVIDER=supabase` to use Supabase for the database and document storage instead.
No external AI credentials are required.
