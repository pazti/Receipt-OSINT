# AGENTS.md

## Project Context

ReceiptCheck is a Vite + React application deployed on Vercel. Firebase provides Authentication, Firestore, and Storage. Keep changes focused and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Key Files

- `src/`: frontend application source.
- `src/lib/firebase.js`: Firebase client initialization.
- `src/api/receiptChecks.js`: authenticated Firestore and Storage access.
- `api/`: Vercel serverless functions.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm run dev` for local frontend work. Vercel functions require `vercel dev`.
- Keep Firebase Admin credentials and Telegram secrets server-side; only Firebase web configuration belongs in `VITE_FIREBASE_*` variables.
- Enforce user ownership in Firestore and Storage rules as well as frontend queries.
- Run the relevant checks from `package.json` before finishing code changes.
