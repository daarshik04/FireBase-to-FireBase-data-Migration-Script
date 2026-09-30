# Firebase Firestore Migration

This project copies Firestore data from one Firebase project to another, including nested subcollections. It is designed for controlled migration workflows where you want to preview the operation, migrate data in batches, and verify that the destination matches the source.

## Features

- Recursively migrates Firestore collections and subcollections
- Writes documents in batches for safer bulk transfers
- Supports a dry-run mode before writing data
- Verifies that source and destination document paths match after migration
- Prints a migration summary report

## Project structure

- `src/index.js` — entry point for running the migration
- `src/migrate.js` — recursive migration logic
- `src/firebase.js` — Firebase source and destination app initialization
- `src/verify.js` — post-migration verification logic
- `src/stats.js` — migration reporting utilities
- `src/config.js` — project config and CLI flags
- `credentials/` — service account JSON files

## Prerequisites

- Node.js installed
- Two Firebase projects with Firestore enabled
- Service account JSON files for both the source and destination projects

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your Firebase service account credentials in the `credentials/` folder.

3. Create a `.env` file in the project root with the required paths:

```env
SOURCE_FIREBASE_CREDENTIALS_PATH="credentials/source-service-account.json"
DESTINATION_FIREBASE_CREDENTIALS_PATH="credentials/destination-service-account.json"
```

> The project already includes a `.env` file in this workspace, but you should update it to match your actual credential file names and paths before running the migration.

## Usage

Run the migration:

```bash
node src/index.js
```

Run a dry run without writing data:

```bash
node src/index.js --dry-run
```

Verify only (compare source and destination document paths without migrating):

```bash
node src/index.js --verify
```

## How it works

- The app initializes Firebase Admin SDK connections for both the source and destination projects.
- It lists all top-level collections in the source Firestore database.
- Each collection is copied recursively to the destination database.
- After the transfer, a verification step checks whether the document path sets match exactly.
- A summary report is displayed in the terminal.

## Security notes

- Do not commit `.env` files or service account JSON files to GitHub.
- The repository includes `.env` and `credentials/` in `.gitignore` for this reason.
- Ensure least-privilege service account permissions are used for both projects.

## Notes

This utility is intended for migrating Firestore data between Firebase environments. It is not a general-purpose schema migration tool and should be used carefully in non-production environments first.
