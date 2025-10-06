const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",             // your MySQL username
  password: "SWEGrp1", // your MySQL password
  database: "loginDB"       // your database
});

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL (Register)");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  // Hash password with SHA-256
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  const sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
  db.query(sql, [username, hash], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Registration successful" });
  });
});

app.listen(3001, () =>
  console.log("Register server running on http://localhost:3001")
);
