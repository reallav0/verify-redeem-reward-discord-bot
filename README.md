# Discord Verification & Code API (Commissions)

A combined **Discord bot** and **Express API** for generating and managing unique verification or beta access codes.
Built for game integrations such as *Pet Fighters*, where users can obtain Discord-linked codes redeemable in-game.

---

## Features

* Slash commands to post verification and beta-code embeds
* Unique code generation based on Discord user ID
* MongoDB storage for issued codes
* Prevents duplicate code generation
* REST API endpoints for verification and claiming codes
* Simple Express server for backend API

---

## Tech Stack

* Node.js
* Discord.js v14
* Express
* MongoDB
* dotenv
* crypto

---

## Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/discord-code-api.git
   cd discord-code-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```bash
   TOKEN=your_discord_bot_token
   SERVER_ID=your_discord_server_id
   MONGODB=your_mongodb_connection_string
   ```

4. Start the bot and API:

   ```bash
   node index.js
   ```

The bot will go online and the API will run on `http://localhost:3000`.

---

## Slash Commands

| Command       | Description                                       |
| ------------- | ------------------------------------------------- |
| `/verifypost` | Sends a Discord embed for verification codes.     |
| `/codepost`   | Sends a Discord embed for beta/pre-release codes. |

---

## API Endpoints

### POST `/api/verify`

Verifies and consumes a verification code.

```json
{ "code": "string" }
```

### POST `/api/claim`

Claims a beta/release code.

```json
{ "code": "string" }
```

**Response Example:**

```json
{ "result": true }
```

---

## License

MIT License © 2025 ReallAv0
