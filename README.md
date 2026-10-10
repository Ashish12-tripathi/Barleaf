# BookLeaf Author Support Portal

A MERN-style author support ticket demo using React + Vite, Express, MongoDB/Mongoose, and OpenAI.

## Requirements
- Node.js LTS and npm
- MongoDB Atlas URI (or local MongoDB)
- OpenAI API key (optional; tickets still save with a fallback draft if AI is unavailable)

## Quick start in VS Code

1. Extract this ZIP and open the `bookleaf-portal` folder in VS Code.
2. Configure `backend/.env` using `backend/.env.example` as a template.
3. Configure `frontend/.env` using `frontend/.env.example` as a template.
4. In terminal 1:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. In terminal 2:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. Open http://localhost:5173

## Environment files

Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `OPENAI_API_KEY`.
Copy `frontend/.env.example` to `frontend/.env`. Defaults point to the local backend.

Never commit real `.env` files or API keys.

## API
- `GET /` — API status
- `GET /api/health` — API/database health
- `POST /api/tickets/create` — create ticket and generate AI suggestions

## Demo limitations
The author ID (`AUTH001`) is hardcoded for demonstration. Add authentication and authorization before production use. AI output is a draft and must be reviewed before being sent to an author.
