# HackForge

A cybersecurity learning platform: study modules, a 9-challenge CTF arena, practice labs, a daily vulnerability, a dashboard with a leaderboard, and verifiable certificates.

> For learning and authorized testing only. Never test systems you don't have permission to test.

## What's inside

| Area | Files |
|------|-------|
| Home / info | `index.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, `roadmap.html` |
| Study modules | `cybersecurity-101`, `networking`, `operating-systems`, `linux-cheatsheet`, `web-fundamentals`, `red-team`, `blue-team`, `siem`, `cloud-security`, `sql-injection`, `password-cracking`, `awareness`, `technical-awareness`, `cybersecurity-activities` (`.html`, some with `.pdf`) |
| CTF Arena | `main.html` (hub), `challenge1`-`challenge9.html`, targets: `target.html`, `user.html`, `secret.html`, `config.txt`, `robots.txt`, `backup.zip` |
| Accounts | `login`, `register`, `dashboard`, `settings` |
| Learning feed | `learn.html` (daily vulnerability + tools, from Firestore), `cyber-news.html` |
| Certificates | `certificate.html` (issued server-side), `verify.html` |
| Backend | `firestore.rules`, `functions/` (Cloud Functions), `firebase.json` |

## How it's secured

- **Firestore rules** (`firestore.rules`): a user can only read their own `users/{uid}` document. The leaderboard is a separate public `leaderboard` collection holding only a display name and points. `points`, `streak`, `certificates` etc. can never be written from the browser.
- **Scoring is server-side**: the `submitFlag` function checks flags (stored only as SHA-256 hashes in `functions/flags.js`) and awards each flag once.
- **Certificates** are issued by `issueCertificate` from the account's real name and score (needs 100 points).
- **AI chat** goes through the `chat` function so the Anthropic API key stays in Secret Manager.
- The Firebase web config in `firebase-config.js` is public by design; the rules are what protect the data.

## Deploying the backend

```bash
npm i -g firebase-tools && firebase login
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only firestore:rules,functions
```

Functions need the Blaze plan. After deploying, if the `chat` URL differs from `CHAT_ENDPOINT` in `index.html`, update it.

Existing users will not appear on the leaderboard until their `users/{uid}` document is next written (the `syncLeaderboard` function mirrors it). To backfill, edit each user doc once, or run a one-off Admin SDK script.

## Local preview

It's static HTML, so any static server works, e.g. `python3 -m http.server`.
