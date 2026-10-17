# Saarthi

Saarthi is a React/Vite academic workspace with an Express, MongoDB, and Socket.IO API. Students can request accounts through `/register`; requests stay inactive until an administrator checks the official institutional record and approves them. Faculty and administrator accounts are provisioned by an administrator. There is no public faculty/admin role selection or demo role switcher.

## Requirements

- Node.js 20 or newer
- A MongoDB Atlas cluster or reachable MongoDB deployment
- An administrator-provisioned institutional account

## Configure MongoDB and the API

1. In Atlas, create a database user with access to a dedicated Saarthi database. Add the development machine's public IP to Atlas Network Access. Copy the driver's connection string.
2. Copy `.env.example` to `.env` and replace `MONGODB_URI` and `JWT_SECRET`. Generate a random secret of at least 32 characters. Never commit `.env` or expose these values in frontend variables.
3. Install dependencies with `npm install`.
4. Run `npm run admin:create` once to connect to MongoDB and create the first administrator. The script refuses to add another administrator if one already exists.
5. Start the API with `npm run dev:server` and the UI with `npm run dev` in a second terminal. Vite proxies `/api` and `/socket.io` to `127.0.0.1:4000`.
6. Open the Vite address. Students can submit a registration request at `/register`; an administrator signs in, verifies the ID and roster reference, and approves it under **Pending student registrations**. Faculty accounts are provisioned by an administrator. `/api/health` reports API/database availability.

For production, set `NODE_ENV=production`, use HTTPS, set `CLIENT_ORIGINS` to the deployed frontend origin, configure the API reverse proxy, and provide a production-only JWT secret. HttpOnly cookies are Secure in production. Keep the frontend and API under the same site when using SameSite=Strict cookies.

## Enter institutional records

Use the administrator-only `/api/admin` endpoints to create subjects, users, sections, concepts, and questions. `POST /api/admin/users` requires an institutional ID and an institutional record reference for student/faculty accounts; administrators must validate that reference against their official roster before provisioning. Create sections after subjects and accounts, with their member IDs. The small setup UI creates subjects and accounts; section, concept, and question bulk entry can use the protected API. No demo records are seeded.

Faculty are assigned to sections by an administrator. Faculty can then publish marks and assignments, and create attendance sessions for their assigned sections. Student records are limited by enrollment. The admin bootstrap CLI is the only way to create the first administrator.

## Live features and limitations

- Student dashboard, academics, attendance, assignments, evidence-based learning plans, assessments, practice, and progress use API responses.
- Faculty dashboard, analytics, roster/marks/assignment views, and QR attendance use assigned classes and persisted records.
- Attendance QR payloads are signed server-side, valid for 12 seconds, rotated every 10 seconds, bound to an active session and enrollment, and recorded with a unique session/student constraint. Faculty corrections require a reason and are audited.
- Socket connections authenticate with the access cookie and join only the user's private room and assigned section rooms. Clients refresh API data after reconnect and relevant events.
- A screenshot may still be shared within the token's short validity window. QR attendance alone does not prove physical presence; use teacher review or an additional presence check where required.
- Learning gaps are only created when a concept has at least three recorded responses. Scores are calculated and persisted by the server; answer keys are not included in question-list responses.
- The UI currently offers basic administrator subject/account creation. Creating sections, concepts, and questions, bulk imports, password reset, and institutional identity verification integrations require a trusted administrator workflow or a future integration.

## Checks

```sh
npm run test:server
npm run build
```

The automated unit tests do not require MongoDB. Full authentication, persistence, permissions, socket, and concurrent attendance integration checks require a configured test database and are not run against production data.
