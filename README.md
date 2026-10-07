# Firebase Migration Tool

## Purpose

This project copies documents from a source Firebase Cloud Firestore database to a destination Firestore database. It recursively includes nested subcollections, writes documents in batches, supports a no-write dry run, and can verify the destination against the source.

Use it for controlled Firestore data transfers. It is not a schema-conversion tool and does not migrate other Firebase products.

## Architecture

- `src/server.js` starts the Express web server and serves the static interface from `public/`.
- `src/routes/` defines the database-information and migration HTTP endpoints.
- `src/services/` provides database summaries and coordinates background migrations.
- `src/firebase.js` initializes Firebase Admin connections to both projects using service account files.
- `src/migrate.js` copies top-level collections and recursively copies their subcollections in batches of 400 documents.
- `src/verify.js` compares document paths and data between the databases.
- `src/index.js` is the CLI entry point; `src/config.js` reads credential paths and CLI flags.

The web API and CLI use the same migration and verification services. The web migration runs in the background, while CLI commands run in the foreground and report their result in the terminal.

## Requirements

- Node.js and npm, using a Node.js release supported by the installed Firebase Admin SDK.
- Access to two Firebase projects with Cloud Firestore enabled.
- A service account JSON credential for each project.
- Network access to the Firebase/Google Cloud APIs from the machine running the tool.

The source account must be able to read the collections and subcollections being migrated. The destination account must be able to create and update documents there. Both credentials need read access for verification.

## Installation

From the project root, install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the project root. Set each value to a path to the corresponding credential JSON file. Relative paths are resolved from the project root.

```env
SOURCE_FIREBASE_CREDENTIALS_PATH=credentials/source-service-account.json
DESTINATION_FIREBASE_CREDENTIALS_PATH=credentials/destination-service-account.json
```

The paths above are examples; change them to match your local filenames. `.env` and `credentials/` are excluded by `.gitignore`. The migration batch size is currently fixed at 400 documents in `src/config.js`.

## Credential Setup

1. Create or select a service account for each Firebase project.
2. Grant the source account permission to read the Firestore data, including subcollections, and grant the destination account permission to read and write the target data.
3. Download each service account key as a JSON file and store it locally in the ignored `credentials/` directory.
4. Set the credential file paths in `.env` as described above.
5. Confirm that the destination project is the intended target before running a real migration.

Do not paste private keys into source files, commit credential JSON files, or share them in logs or chat. Prefer short-lived or managed credentials where the deployment environment supports them.

## Running the Application

Start the Express application:

```bash
npm start
```

The web application is served at [http://localhost:3000](http://localhost:3000). The server currently listens on port 3000, configured in `src/server.js`. Credentials must be configured before starting because Firebase Admin clients are initialized when the server loads.

## Running CLI Migration

Run a real migration from the project root:

```bash
npm run migrate
```

This reads the source database, writes source documents to the destination, prints a migration report, and then runs verification. Existing destination documents at matching paths are overwritten with source document data. Documents that exist only in the destination are not deleted.

## Dry Run

Preview the traversal and document counts without committing writes:

```bash
npm run dry-run
```

A dry run still connects to Firestore and reads source documents and subcollections. It does not write destination documents and does not perform the post-migration verification step. Use it to confirm access and inspect the planned work before running `npm run migrate`.

## Verification

Run verification without copying data:

```bash
npm run verify
```

Verification reads both databases and compares document paths and document data. It reports missing destination documents, destination-only documents, and data mismatches. A failed CLI verification exits with a nonzero status. Verification does not compare Firestore security rules, indexes, database settings, or other Firebase resources.

## Application API

The API is available on the same host and port as the web application (`http://localhost:3000`). Database inspection endpoints read Firestore when called. Responses are JSON.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Returns `{"status":"UP"}` when the Express server is responding. This does not check Firebase connectivity. |
| `GET` | `/api/database/source` | Reads source database information and returns it in a `database` field. Returns HTTP 500 if the database read fails. |
| `GET` | `/api/database/destination` | Reads destination database information and returns it in a `database` field. Returns HTTP 500 if the database read fails. |
| `GET` | `/api/migration/status` | Returns the current in-memory migration state and document/collection counters. |
| `POST` | `/api/migration/start` | Starts a background migration and subsequent verification; returns HTTP 202. Returns HTTP 409 if a migration is already running. No request body is required. |

Migration status includes a state (`IDLE`, `RUNNING`, `COMPLETED`, `VERIFICATION_FAILED`, or `FAILED`), start/finish timestamps, verification result when available, an error when one occurred, and counters. Status is held in process memory and resets when the server restarts.

Example requests:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/database/source
curl http://localhost:3000/api/database/destination
curl http://localhost:3000/api/migration/status
curl -X POST http://localhost:3000/api/migration/start
```

## Migration Flow

1. Firebase Admin connects to the source and destination using the configured service accounts.
2. The tool lists source top-level collections, reads their documents, and recursively discovers and copies subcollections.
3. Documents are written to the destination in batches of up to 400. Matching destination documents are replaced with the source data.
4. The CLI migration and the application migration run a verification pass after writing. A dry run skips writes and verification; the verify command runs verification only.
5. The CLI prints a report, or the API exposes progress and the final status while the web migration runs in the background.

## Limitations

- Only Firestore document data and nested subcollections are copied. Firebase Authentication users, Storage files, security rules, indexes, triggers, and project configuration are not migrated.
- The migration does not delete destination-only documents. Review and clean up destination data separately if an exact replacement is required.
- Source data changing during a migration can cause verification differences; quiesce writes or plan a maintenance window for consistency-sensitive transfers.
- A web migration lock and status exist only in the current Node.js process. Multiple server instances do not coordinate migrations.
- The web API does not currently include authentication or authorization. Do not expose it to an untrusted network.
- The current batch size is fixed at 400; large migrations may take time and consume Firestore read/write quota.

## Security Considerations

- Never commit `.env` or service account JSON files. Both are ignored by `.gitignore`; verify that secrets are not tracked before pushing.
- Give each service account only the permissions needed for its source or destination role, and rotate/revoke keys when they are no longer needed.
- Run the tool from a trusted environment. The migration-start endpoint can write data, and the API has no built-in authentication or authorization.
- Keep the server bound to a trusted network boundary, use firewall rules or a secured reverse proxy if remote access is required, and do not treat `/api/health` as a connectivity or authorization check.
- Test with a dry run and, where practical, a non-production project before migrating production data. Keep an independent backup of important data.
