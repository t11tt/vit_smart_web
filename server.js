const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const port = 4922;

const db = new Database("app.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required."
    });
  }

  try {
    const statement = db.prepare(`
      INSERT INTO users (email, password)
      VALUES (?, ?)
    `);

    statement.run(email, password);

    res.json({
      success: true,
      message: "Registration successful."
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required."
    });
  }

  const statement = db.prepare(`
    SELECT id, email
    FROM users
    WHERE email = ? AND password = ?
  `);

  const user = statement.get(email, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password."
    });
  }

  res.json({
    success: true,
    message: "Login successful.",
    email: user.email
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});