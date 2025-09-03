# NajahElDarain – Bokningsplattform för Coworking

Författare: **Lahouaria Sahla**

Fullstack-app (React + Vite + Node/Express + MongoDB) för att boka arbetsplatser och konferensrum.  
Stöd för roller (User/Admin), JWT, krockkontroll, realtidsnotiser (Socket.IO) och Redis-cache för rum.

---

## Funktioner

- **Auth:** registrera & logga in (JWT).
- **RBAC:**
  - **User** – se/skapa/uppdatera/ta bort egna bokningar.
  - **Admin** – hantera rum, alla bokningar samt användare.
- **Bokningar:** krockkontroll i samma rum & tidsfönster.
- **Realtidsnotiser:** booking:created/updated/deleted via Socket.IO.
- **Caching:** `GET /api/rooms` kan cacheas kort i Redis (valfritt).

---

## Mappstruktur

backend/ → Express/MongoDB API
frontend/ → React/Vite/Tailwind UI

yaml
Kopiera kod

---

## Förkrav

- Node.js **18+**
- MongoDB (lokalt eller Atlas)
- Redis (valfritt, endast för caching av rum)

---

## Miljövariabler

### Backend (`backend/.env`)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/cowork_bookings_najah
JWT_SECRET=change_this_secret
JWT_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
NODE_ENV=development
Frontend (frontend/.env.local)
env
Kopiera kod
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000  # valfritt – för Socket.IO
VITE_APP_NAME=NajahElDarain
När du deployar:

Backend (Render) → lägg in backend .env i Render dashboard.

Frontend (Netlify) → lägg in frontend .env.local variabler i Netlify dashboard.

Starta projektet (lokalt)
1) Backend
bash
Kopiera kod
cd backend
npm install
npm run dev
Du bör se:

arduino
Kopiera kod
info: MongoDB connected
info: API ready on :4000
info: Redis connected    # endast om Redis körs
Hälsokoll:
http://localhost:4000/health → { "ok": true }

2) Frontend
bash
Kopiera kod
cd frontend
npm install
npm run dev
Öppna den URL Vite skriver ut (t.ex. http://localhost:5173).

Skapa admin-konto
Registrera användare via UI eller:

bash
Kopiera kod
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'
Gör kontot till admin i MongoDB:

bash
Kopiera kod
mongosh
use cowork_bookings_najah
db.users.updateOne({ username: "admin" }, { $set: { role: "Admin" } })
API-dokumentation
Autentisering
Alla skyddade rutter kräver header:

makefile
Kopiera kod
Authorization: Bearer <JWT_TOKEN>
POST /api/register – skapa användare

POST /api/login – logga in

Rum (endast Admin för skriv)
GET /api/rooms

POST /api/rooms

PUT /api/rooms/:id

DELETE /api/rooms/:id

Bokningar
GET /api/bookings

POST /api/bookings

PUT /api/bookings/:id

DELETE /api/bookings/:id

Användare (endast Admin)
GET /api/users

DELETE /api/users/:id

Frontend-sidor
/ – Hem

/rooms – Lista rum + boka

/bookings – Mina bokningar

/admin/rooms – Hantera rum (admin)

/admin/bookings – Hantera alla bokningar (admin)

/admin/users – Hantera användare (admin)

/login – Logga in

/register – Registrera

/about – Om sidan

Vanliga fel
401 Invalid token – token saknas/ogiltig/utgången.

400 Krock – tiderna överlappar annan bokning i samma rum.

500 /api/rooms – om Redis saknas: ta bort REDIS_URL eller starta Redis.

CORS-fel – CORS_ORIGIN måste exakt matcha frontend-origin (inkl. port).

Licens & Credits
Licens: MIT

Skapad av Najah El Darain

Frontend: React + Vite + TypeScript + Tailwind

Backend: Express + Mongoose + JWT + Socket.IO (+ Redis-cache)