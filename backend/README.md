NajahElDarain – Bokningsplattform för Coworking

Författare: Lahouaria Sahla

Fullstack-app (React + Node/Express + MongoDB) för att boka arbetsplatser och konferensrum.
Stöd för roller (User/Admin), JWT, krockkontroll, realtidsnotiser (Socket.IO) och Redis-cache för rum.

Funktioner

Auth: registrera & logga in (JWT).

RBAC:

User – se/skapa/uppdatera/ta bort egna bokningar.

Admin – hantera rum, alla bokningar samt användare.

Bokningar: krockkontroll i samma rum & tidsfönster.

Realtidsnotiser: booking:created/updated/deleted via Socket.IO.

Caching: GET /api/rooms kan cacheas kort i Redis (valfritt).

Mappstruktur
backend/
  src/...
frontend/
  src/...


(Se respektive katalog/kod för detaljer.)

Kom igång (lokalt)
1) Förkrav

Node.js 18+

MongoDB (lokalt eller Atlas)

Redis (valfritt, endast för cachning av rum)

2) Miljövariabler

backend/.env

PORT=4000
MONGO_URI=mongodb://localhost:27017/cowork_bookings_najah
JWT_SECRET=change_this_secret
JWT_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
NODE_ENV=development


frontend/.env.local

VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000  # valfritt – för Socket.IO
VITE_NAME=Najah El Darain              # visas i footern

3) Starta backend
cd backend
npm install
npm run dev


Du bör se:

info: MongoDB connected
info: API ready on :4000
info: Redis connected    # endast om Redis körs


Hälsokoll: GET http://localhost:4000/health → { "ok": true }

4) Starta frontend
cd frontend
npm install
npm run dev


Öppna URL:en som Vite skriver ut (t.ex. http://localhost:5173).

5) Skapa admin

Registrera användare via UI eller:

curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'


Gör kontot till admin i MongoDB:

mongosh
use cowork_bookings_najah
db.users.updateOne({ username: "admin" }, { $set: { role: "Admin" } })


Logga in som admin i frontend och testa adminsidorna.

API-dokumentation

Alla skyddade rutter kräver header:

Authorization: Bearer <JWT_TOKEN>

Autentisering

POST /api/register
Body:

{ "username": "alice", "password": "pass1234" }


Svar 200:

{
  "token": "<jwt>",
  "user": { "id": "68...", "username": "alice", "role": "User" }
}


POST /api/login
Body:

{ "username": "alice", "password": "pass1234" }


Svar 200: samma struktur som /api/register.

Rum (Admin för skrivoperationer)

GET /api/rooms → 200

[
  {
    "_id": "68...",
    "name": "Konferensrum 1",
    "capacity": 8,
    "type": "conference",
    "imageUrl": "",
    "description": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]


POST /api/rooms (Admin)
Body:

{
  "name": "Konferensrum 1",
  "capacity": 8,
  "type": "conference",
  "imageUrl": "https://...",
  "description": "Ljust rum"
}


Svar 201 – skapat rum (objekt).

PUT /api/rooms/:id (Admin)
Body (valfria fält):

{ "name": "Nytt namn", "capacity": 10 }


Svar 200 – uppdaterat rum (objekt).
400 – { "error": "Room not found" }.

DELETE /api/rooms/:id (Admin)
204 – No Content.
400 – { "error": "Room not found" }.

Bokningar

User: ser & hanterar egna bokningar. Admin: ser & hanterar alla.

GET /api/bookings → 200

[
  {
    "_id": "68...",
    "roomId": { "_id": "68...", "name": "Konferensrum 1", "type": "conference" },
    "userId": { "_id": "68...", "username": "alice" },
    "startTime": "2025-09-01T10:00:00.000Z",
    "endTime": "2025-09-01T12:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
]


POST /api/bookings
Body (skicka tider som ISO 8601 UTC med Z):

{
  "roomId": "68b35a3d9ff91fd94abf317b",
  "startTime": "2025-09-01T10:00:00.000Z",
  "endTime":   "2025-09-01T12:00:00.000Z"
}


201 – skapad bokning (objekt).
400 – krock/valideringsfel, t.ex.

{ "error": "Room is not available in that time window" }


PUT /api/bookings/:id
Body (valfritt):

{ "startTime": "2025-09-01T11:00:00.000Z", "endTime": "2025-09-01T13:00:00.000Z" }


200 – uppdaterad bokning.
403 – { "error": "Not allowed" } (inte ägare/ej admin).
400 – krock/valideringsfel.

DELETE /api/bookings/:id
204 – No Content (om ägare eller admin).
403 – { "error": "Not allowed" }.
400 – { "error": "Booking not found" }.

Användare (Admin)

GET /api/users → 200

[
  { "_id": "68...", "username": "admin", "role": "Admin" },
  { "_id": "68...", "username": "alice", "role": "User" }
]


DELETE /api/users/:id → 204 – No Content.

Realtidsnotiser (Socket.IO)

Händelser server → klient

booking:created – payload: booking (objekt)

booking:updated – payload: booking (objekt)

booking:deleted – payload: { "id": "<bookingId>" }

Socket-strategi

Användar-socket går med i rum med sitt userId.

Admin-socket går även med i admins.

Exempel (Windows CMD)
:: logga in och kopiera token
set TOKEN=PASTE_JWT_HERE

:: lista rum
curl -i http://localhost:4000/api/rooms -H "Authorization: Bearer %TOKEN%"

:: skapa bokning
curl -i -X POST http://localhost:4000/api/bookings ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"roomId\":\"68...\",\"startTime\":\"2025-09-01T10:00:00.000Z\",\"endTime\":\"2025-09-01T12:00:00.000Z\"}"

Vanliga fel

401 Invalid token – skicka Authorization: Bearer <token> (utan citattecken). Token kan ha gått ut.

400 Krock – tiderna överlappar annan bokning i samma rum.

500 /api/rooms – om Redis saknas: ta bort REDIS_URL eller starta Redis. Appen fungerar utan Redis (cachen hoppas över).

CORS – CORS_ORIGIN måste exakt matcha frontend-origin, inkl. port.

Licens & Credits

Licens: MIT (eller valfri annan).

Skapad av Najah El Darain.
Frontend: React/Vite/TS/Tailwind. Backend: Express/Mongoose/JWT/Socket.IO (+ Redis-cache).