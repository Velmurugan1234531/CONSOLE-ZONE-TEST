---
description: connect website to admin node and manage protected telemetry
---
# Admin Node Connection & Protected Management Workflow

This workflow ensures a secure and verifiable connection between the frontend website and the backend tracking server (Admin Node).

## 1. Environment Preparation
Ensure the following variables are set in `.env.local`:
- `NEXT_PUBLIC_SOCKET_URL`: URL of the Socket.IO server (e.g., `http://localhost:3001`)
- `JWT_SECRET`: Secret key for verifying administrative tokens.

## 2. Start the Admin Node
Execute the socket server in the background:
// turbo
`npx tsx src/server/socket.ts`

## 3. Handshake Protocol
The website connects using the following protocol:
- **Client**: Initiates `io(URL, { auth: { token: USER_JWT } })`.
- **Server**: 
  - Validates JWT via middleware.
  - If valid, joins user to specific rooms (e.g., `riders` if authorized).
  - Emits `uplink_confirmed` back to client.

## 4. Protected Management Actions
- **Monitoring**: Open the `LiveTrackingNexus` in the Admin Dashboard to see real-time signals.
- **Access Control**: Users must be authenticated via Firebase to emit location data.
- **Admin Only**: Only users with the `admin` role (verified via JWT) can subscribe to the global telemetry feed.
