# ReceiptCheck

ReceiptCheck is a Vite + React dashboard for reviewing transfer receipt checks. Vercel serves the frontend and serverless API routes; Firebase provides Authentication, Firestore, and private image storage.

## Current Status

Email/password and Google sign-in, password reset, owner-scoped receipt reads, dashboard statistics, and Telegram webhook setup are wired to Firebase/Vercel.

Receipt ingestion, OCR, image manipulation analysis, reference verification, verdict scoring, and Firestore writes are **not implemented in this repository**. The Telegram webhook currently replies that analysis is unavailable. The dashboard will remain empty until that processing pipeline is added and writes documents using the schema below. Do not treat this deployment as a working receipt-verification service yet.

## Stack

- Frontend: React 18, Vite, Tailwind CSS
- Hosting and API: Vercel (`api/` serverless functions)
- Authentication: Firebase Auth (email/password and Google)
- Database: Cloud Firestore
- Receipt images: Firebase Storage, served through short-lived signed URLs
- Telegram: Telegram Bot API from Vercel serverless functions

## Local Development

Use Node.js 22 and npm. Install dependencies, copy the environment template, and add your Firebase web app settings:

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev` serves only the Vite frontend. To run the Vercel API routes locally, install the [Vercel CLI](https://vercel.com/docs/cli) and run:

```bash
vercel dev
```

The frontend is served at `http://localhost:5173` with Vite or `http://localhost:3000` with Vercel. Telegram cannot send webhook updates to localhost; use a public HTTPS development URL to test the bot callback.

## Firebase Setup

1. Create a Firebase project and register a web app.
2. Enable Email/Password and Google under **Authentication → Sign-in method**. Add the local and production domains to Authorized domains.
3. Create a Firestore database and a Storage bucket.
4. Put the Firebase web app values in the `VITE_FIREBASE_*` variables in `.env.local` and Vercel. These values are public client configuration, not service credentials.
5. Deploy the database rules, composite indexes, and Storage rules:

	```bash
	npm install --global firebase-tools
	firebase login
	firebase use --add
	firebase deploy --only firestore:rules,firestore:indexes,storage
	```

The Admin SDK service-account JSON is server-only. Set `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_STORAGE_BUCKET` in the local Vercel environment and Vercel project settings. Never put the service account in a `VITE_*` variable or commit it.

## Environment Variables

| Variable | Used by | Description |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Browser | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Browser | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Browser | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Browser | Firebase Storage bucket name |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Browser | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Browser | Firebase web app ID |
| `FIREBASE_SERVICE_ACCOUNT` | Server only | Service-account JSON for Firebase Admin |
| `FIREBASE_STORAGE_BUCKET` | Server only | Bucket used to create signed image URLs |
| `TELEGRAM_BOT_TOKEN` | Server only | Telegram bot token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Server only | Telegram webhook request secret (1–256 letters, digits, `_` or `-`) |
| `TELEGRAM_OWNER_UID` | Server only | Firebase UID allowed to configure the shared bot |
| `TELEGRAM_ALLOWED_USER_ID` | Server only | Telegram numeric user ID allowed to submit receipt photos |
| `APP_BASE_URL` | Server only | Public HTTPS origin used to register the webhook; Vercel can fall back to `VERCEL_URL` |

For `FIREBASE_SERVICE_ACCOUNT`, store the complete service-account JSON as a single environment-variable value. Keep all server-only variables out of the browser bundle.

## Data Model

The dashboard reads documents from `receiptChecks/{checkId}`. Each document must include `ownerUid` and `created_date`; `created_date` should be an ISO-8601 string. The owner UID is required for every dashboard query and rule.

| Field | Type | Purpose |
| --- | --- | --- |
| `ownerUid` | string | Firebase UID that owns the check |
| `created_date` | ISO-8601 string | Sort and daily-stat timestamp |
| `verdict` | string | `real`, `suspicious`, or `fake` |
| `amount` | number | Amount reviewed in NGN |
| `processing_ms` | number | Processing duration |
| `storage_path` | string | Private object path, e.g. `receipts/{ownerUid}/{checkId}.jpg` |
| `ela_hotspots` | array | Normalized image-analysis regions |
| `reasons` | string array | Verdict explanation |

Additional fields displayed by the detail view include `reference`, `transaction_at`, `sender_name`, `sender_account`, `recipient_account`, `beneficiary`, `from_bank`, `to_bank`, `risk_score`, `reference_valid`, `reference_note`, `bank_verified`, `bank_verify_note`, `ela_score`, `ocr_text`, and `error_message`.

Client writes to `receiptChecks` and direct Storage access are denied by the Firebase rules. The future processing function should use Firebase Admin, set `ownerUid`, and upload images under that owner's `receipts/{uid}/` path. The image URL endpoint verifies the Firebase ID token and returns a 15-minute signed URL only for that user's path.

## Telegram API

The Setup page calls `POST /api/telegram/connect` with a Firebase ID token. The endpoint supports `status`, `connect`, and `save-verifier` actions. Configure `TELEGRAM_OWNER_UID` to the dashboard owner's Firebase UID; only that account can manage the shared bot. The webhook endpoint is `POST /api/telegram/webhook` and validates Telegram's secret-token header.

The webhook accepts private photo messages only from `TELEGRAM_ALLOWED_USER_ID`. It runs English OCR, extracts likely amount and reference text, and writes an owner-scoped Firestore check with a resized, compressed base64 JPEG. Telegram downloads up to 20 MB are accepted; the stored image is compressed to 600 KB or less to leave room for Firestore's 1 MiB document limit. OCR does not determine authenticity, and this endpoint does not run image-tampering analysis or confirm transactions with a bank; results are therefore marked inconclusive.

## Deploy

1. Push the repository to GitHub and import it into Vercel. Vercel detects Vite; the SPA rewrite is in `vercel.json`.
2. Add the browser Firebase variables and server-only variables in **Vercel → Project Settings → Environment Variables**.
3. Add the deployed Vercel domain to Firebase Auth's Authorized domains.
4. Deploy Firestore rules, indexes, and Storage rules with the Firebase CLI.
5. Deploy the Vercel project and test sign-in before connecting Telegram.

## Checks

```bash
npm run build
npm run lint
npm run typecheck
```
