# Secure Chat API Documentation

## Overview
Base URL: `/api`
Authentication: Custom RSA/AES Encryption Handshake.
Session: Mock uses `X-User-ID` header. Production should use JWT.
Real-time: WebSocket simulation for message pushing.

---

## 1. Authentication

### Get Server Public Key
Retrieves the server's RSA Public Key to initiate the handshake.

*   **URL:** `/auth/key`
*   **Method:** `GET`
*   **Response:** `JsonWebKey` object.

### Login
Authenticates the user and exchanges the Client's Public Key.
**Note:** `password` must be SHA-256 hashed before encryption.

*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Request Body (Decrypted):**
    ```json
    {
      "username": "Alice",
      "password": "sha256-hash-of-password",
      "clientPublicKey": { ...JWK... }
    }
    ```
*   **Response (Decrypted):**
    ```json
    {
      "status": "ok",
      "user": {
        "id": "1001",
        "name": "Alice",
        "avatar": "http://...",
        "sidebarWallpaper": "",
        "chatWallpaper": ""
      }
    }
    ```
*   **Errors:** `401 Unauthorized` if credentials invalid.

---

## 2. Real-time Communication (WebSocket)

The application simulates a WebSocket connection for receiving messages in real-time.

*   **Connection:** Initiated upon login.
*   **Protocol:** AES Encrypted payload push from server.
*   **Payload Structure (Decrypted):**
    ```json
    {
        "type": "NEW_MESSAGE",
        "data": { ...MessageObject... }
    }
    ```

---

## 3. Contacts (Friends)

### Get Contact List
Fetches the current user's friends. Supports filtering by name/ID via query param.

*   **URL:** `/contacts?q={query}`
*   **Method:** `GET`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Query Params:** `q` (Optional, for filtering existing friends)
*   **Response (Decrypted):**
    ```json
    {
      "data": [
        {
          "id": "1002",
          "name": "Bob",
          "avatar": "...",
          "lastMessage": "Hello",
          "lastMessageTimestamp": 1678900000
        }
      ]
    }
    ```

### Add Friend
Adds a unidirectional or bidirectional friendship.

*   **URL:** `/contacts`
*   **Method:** `POST`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Request Body (Decrypted):**
    ```json
    {
      "friendId": "1002"
    }
    ```
*   **Response (Decrypted):**
    ```json
    {
      "status": "ok"
    }
    ```

### Global User Search
Search for users in the database (who are not necessarily friends yet).

*   **URL:** `/users/search?q={query}`
*   **Method:** `GET`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Response (Decrypted):**
    ```json
    {
      "data": [
        { "id": "1003", "name": "Charlie", "avatar": "..." }
      ]
    }
    ```

---

## 4. Messages

### Get Messages
Retrieves chat history with a specific contact. Supports pagination via `before` timestamp.

*   **URL:** `/messages?contactId={id}&before={timestamp}`
*   **Method:** `GET`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Response (Decrypted):**
    ```json
    {
      "data": [
        {
          "id": "msg_1",
          "senderId": "1001",
          "content": "Hello",
          "type": "TEXT", // TEXT | IMAGE | STICKER
          "timestamp": 1678900000
        }
      ],
      "hasMore": true,
      "nextCursor": 1678890000
    }
    ```

### Send Message
Sends a message to a specific user. 
**Note:** For `IMAGE` or `FILE` types, `content` must be a URL returned by the Upload API.

*   **URL:** `/messages`
*   **Method:** `POST`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Request Body (Wrapper):**
    ```json
    {
      "receiverId": "1002",
      "payload": { ...EncryptedPayload... }
    }
    ```
*   **Request Payload (Decrypted):**
    ```json
    {
      "content": "Hello World", // Or URL for Media
      "type": "TEXT" // TEXT | IMAGE | STICKER
    }
    ```
*   **Response (Decrypted):**
    ```json
    {
      "message": {
          "id": "new_id",
          "senderId": "1001",
          "content": "Hello World",
          "type": "TEXT",
          "timestamp": 1678999999
      }
    }
    ```

---

## 5. Resources

### Upload File
Uploads a file to the server.

*   **URL:** `/upload`
*   **Method:** `POST`
*   **Headers:** `X-User-ID: {currentUserId}`, `Content-Type: multipart/form-data`
*   **Request Body:** `FormData` with key `file`.
*   **Response (Decrypted):**
    ```json
    {
      "url": "https://server.com/uploads/file_123.jpg"
    }
    ```

### Get Stickers
Fetches sticker URLs with pagination.

*   **URL:** `/stickers?page={page}`
*   **Method:** `GET`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Response (Decrypted):**
    ```json
    {
      "stickers": ["url1", "url2", ...],
      "hasMore": true,
      "page": 1,
      "total": 60,
      "totalPages": 5
    }
    ```

---

## 6. Settings

### Update Profile
Updates basic user information.

*   **URL:** `/settings/profile`
*   **Method:** `PUT`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Request Body (Decrypted):**
    ```json
    {
      "name": "New Name",
      "avatar": "Base64 string or URL"
    }
    ```
*   **Response (Decrypted):**
    ```json
    {
      "status": "ok",
      "user": { ...updatedUserObj... }
    }
    ```

### Update Appearance
Updates application background settings.

*   **URL:** `/settings/appearance`
*   **Method:** `PUT`
*   **Headers:** `X-User-ID: {currentUserId}`
*   **Request Body (Decrypted):**
    ```json
    {
      "sidebarWallpaper": "Base64/URL",
      "chatWallpaper": "Base64/URL"
    }
    ```
*   **Response (Decrypted):**
    ```json
    {
      "status": "ok",
      "user": { ...updatedUserObj... }
    }
    ```