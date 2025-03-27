# Chat Integration Service

## Overview
This is a NestJS-based service designed to integrate with an external WebSocket-based chat system available at `ws://localhost:3000`. The service ensures message consistency despite potential delivery issues (e.g., dropped or out-of-order messages), stores chat data in a PostgreSQL database using Knex.js, and provides REST API endpoints for accessing dialogs, messages, and user analytics.

## Setup Instructions

### Prerequisites
- Node.js (v23 or higher)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chat-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This will launch the NestJS application on port 3001 and a PostgreSQL database instance.

### Running Locally (Without Docker)

Update environment variables in a `.env` file (defaults are provided):

- **DATABASE_URL**: `postgresql://postgres:password@localhost:5432/postgres`
- **Port**: `3001`
- **WS_URL**: `ws://localhost:3000`

Run migrations and start the app:

```bash
npm run start:dev
```

---

## API Documentation

### `GET /api/users/:userId/dialogs`
**Description**: Retrieves a paginated list of dialogs for a specific user.

**Query Parameters**:
- `limit` (number, default: 10) - Number of dialogs to return.
- `offset` (number, default: 0) - Pagination offset.

**Response**:
```json
[
  {
    "dialogId": "dialog1",
    "lastMessage": {
      "id": "msg1",
      "dialogId": "dialog1",
      "senderId": "user1",
      "createdAt": 1617183600000,
      "type": "text",
      "content": "Hello!"
    },
    "participants": ["user1"]
  }
]
```

### `GET /api/dialogs/:dialogId/messages`
**Description**: Retrieves a paginated list of messages for a specific dialog.

**Query Parameters**:
- `limit` (number, default: 10) - Number of messages to return.
- `offset` (number, default: 0) - Pagination offset.

**Response**:
```json
[
  {
    "id": "msg1",
    "dialogId": "dialog1",
    "senderId": "user1",
    "createdAt": 1617183600000,
    "type": "text",
    "content": "Hello!"
  }
]
```

### `GET /api/users/:userId/analytics`
**Description**: Retrieves analytics for a specific user.

**Response**:
```json
{
  "totalDialogs": 2,
  "totalMessages": 10,
  "messagesPerDialog": [
    { "dialog_id": "dialog1", "count": 5 },
    { "dialog_id": "dialog2", "count": 5 }
  ],
  "medianResponseTime": 3000, 
  "missedMessagesPerDialog": []
}
```

---

## Database Choice Justification

**PostgreSQL** was selected for the following reasons:

- **Relational Structure**: Well-suited for storing messages and dialogs with relationships (e.g., `senderId`, `dialogId`).
- **Query Performance**: Supports efficient aggregation and analytics queries (e.g., counts, medians).
- **Knex.js Compatibility**: Provides seamless integration with Knex for migrations and querying.
- **Scalability**: Handles large datasets and concurrent connections effectively.

---

## Message Consistency Approach

The external WebSocket service may drop messages or deliver them out of order. The following strategies are implemented to ensure consistency:

- **Duplicate Detection**: Messages are cached in memory using a `Map` keyed by `id` to filter duplicates.
- **Order Correction**: Messages are stored and retrieved in ascending order of `createdAt` to handle out-of-order delivery.
- **Missing Message Detection**: Gaps in `createdAt` timestamps (>10 seconds) are logged as potential missing messages.
  *(Note: No recovery mechanism is implemented due to the lack of an external API for fetching missed messages.)*
- **Database Persistence**: All valid messages are persisted to PostgreSQL to ensure durability.

---

## Assumptions Made

- **No External Recovery API**: The external WebSocket service does not provide a mechanism to fetch missed messages, so detection is logged but not resolved.
- **Simplified Participants**: Dialog participants are represented as an array of `senderId` values derived from messages, assuming a basic one-to-one or group chat model.
- **Message Status**: Not explicitly tracked (e.g., `"delivered"` or `"pending"`) as it wasn’t specified in the external service payload.
- **Analytics Simplification**: Median response time is calculated based on consecutive messages from the same user, assuming a basic chat flow.

---

## Deployment

### Docker Compose Configuration

The `docker-compose.yml` file sets up:

- **App Service**: Runs the NestJS application on port 3001.
- **Database Service**: Runs PostgreSQL with persistent storage.

### Environment Variables

| Variable          | Description                  | Default Value |
|------------------|------------------------------|--------------|
| `DATABASE_HOST`  | PostgreSQL host              | `db`        |
| `DATABASE_PORT`  | PostgreSQL port              | `5432`      |
| `DATABASE_USER`  | PostgreSQL user              | `postgres`  |
| `DATABASE_PASSWORD` | PostgreSQL password        | `postgres`  |
| `DATABASE_NAME`  | PostgreSQL database name     | `chat_db`   |

---

## Testing

### Start the application:

```bash
docker-compose up --build
```

### Simulate WebSocket messages using a client (e.g., `wscat`):

```bash
wscat -c ws://localhost:3000
```

### Send a sample message:

```json
{"type": "NEW_MESSAGE", "payload": {"id": "msg1", "dialogId": "dialog1", "senderId": "user1", "createdAt": 1617183600000, "type": "text", "content": "Hello!"}}
```

### Test API endpoints with `cURL` or Postman:

```bash
curl http://localhost:3000/api/users/:userId/dialogs
curl http://localhost:3000/api/dialogs/:dialogId/messages
curl http://localhost:3000/api/users/:userId/analytics
```

---

## Troubleshooting

1. **Ensure the external WebSocket service is running at** `ws://localhost:3000`.
2. **Check Docker logs if the app fails to start**:

   ```bash
   docker-compose logs
   ```
