# ClickFit 🏋️

A single-page fitness website built as a full-stack technical assessment. Fully responsive, animated, with a live jQuery AJAX data section, drag-and-drop image uploads backed by Node.js, and a MySQL schema driven by a stored procedure.

---

## ✨ Features

- **Responsive UI** — Bootstrap 5 grid + custom CSS, mobile-first.
- **Animations (CSS + JS)**
  - Hero background slow-zoom (`@keyframes`)
  - Staggered fade-up intro for hero title / subtitle / button
  - Scroll-reveal on sections & cards (IntersectionObserver)
  - Card hover lift with emoji scale/rotate
  - Drop-zone amber glow on hover & drag
  - Thumbnail "pop-in" animation on upload
- **Live Data Section** — jQuery `$.ajax()` call to `https://api.restful-api.dev/objects` on page load. Renders the response as cards and writes a metadata line (source URL, item count, timestamp) below the heading.
- **Drag & Drop Upload**
  - HTML5 drag/drop and click-to-browse fallback
  - Client-side validation (MIME type + 5 MB size cap)
  - Instant local preview via `FileReader`
  - Uploads to a Node.js / Express / Multer backend that stores files in `/upload_images`
- **MySQL**
  - `users` table (`userId`, `email`, `password`, `type`, `active`, `createdAt`)
  - `addUser` stored procedure
  - Node routes `GET /users` and `POST /users` that call the procedure

---

## 🧱 Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | HTML5, CSS3, JavaScript, Bootstrap 5, jQuery 3.7 |
| Backend   | Node.js, Express, Multer, CORS, dotenv           |
| Database  | MySQL (`mysql2/promise` connection pool)         |

---

## 📁 Project Structure
click-fit/
├── index.html # main (and only) page
├── css/
│ └── style.css # custom styles + animations
├── js/
│ └── main.js # AJAX, drag/drop upload, scroll reveal
├── upload_images/ # uploaded files (contents gitignored, folder kept via .gitkeep)
├── sql/
│ └── clickfit.sql # schema + addUser stored procedure + CALL
├── docs/
│ └── preview.png # screenshot
├── server/
│ ├── server.js # Express app: /upload, /users
│ ├── db.js # MySQL connection pool
│ ├── .env.example # env template (real .env is gitignored)
│ └── package.json
├── .gitignore
└── README.md

text

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MySQL running locally (via XAMPP / WAMP / Laragon, or a standalone MySQL install)
- phpMyAdmin (comes with XAMPP/WAMP/Laragon) or MySQL Workbench
- A modern browser

### 1. Clone & install

git clone https://github.com/Sagar-sharma77/click-fit.git
cd click-fit/server
npm install

### 2. Configure environment
Copy .env.example → .env and fill in your MySQL credentials:

text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=clickfit
PORT=3000

### 3. Create the database

1. Start Apache and MySQL in the XAMPP control panel.
 
2. Open http://localhost/phpmyadmin in your browser.

3. Click the SQL tab at the top.

4. Open sql/clickfit.sql, copy its contents, and paste into the SQL box.

5. Important: remove the DELIMITER $$ and DELIMITER ; lines — phpMyAdmin handles stored procedures natively and rejects the DELIMITER syntax.

6. Click Go.

7. Verify: in the left sidebar, click clickfit → users table should exist and contain one row.

### 4. Start the backend

cd server
node server.js

### 5. Serve the frontend

Open index.html with the VS Code Live Server extension (recommended), or any static server.

Visit: http://127.0.0.1:5500/index.html

🔌 API Reference

POST http://localhost:3000/upload
Content-Type: multipart/form-data
Field: image     (jpeg | png | gif | webp, <= 5 MB)

response:
{
  "ok": true,
  "filename": "photo-1699999999999-123456.jpg",
  "size": 84213,
  "path": "/uploads/photo-1699999999999-123456.jpg",
  "url": "http://localhost:3000/uploads/photo-1699999999999-123456.jpg"
}

List users

GET http://localhost:3000/users

Response :- 
{
  "ok": true,
  "count": 1,
  "users": [
    { "userId": 1, "email": "sagar@example.com", "type": "user", "active": 1, "createdAt": "..." }
  ]
}

Create a user (calls the addUser stored procedure)

POST http://localhost:3000/users
Content-Type: application/json

{ "email": "a@b.com", "password": "hashed-value", "type": "user", "active": 1 }

response
json
{ "ok": true, "userId": 2 }