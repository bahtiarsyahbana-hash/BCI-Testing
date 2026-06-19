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

The app uses a local SQLite database at `data/app.db` and stores uploaded documents in `uploads/`.
No external AI or database credentials are required.
