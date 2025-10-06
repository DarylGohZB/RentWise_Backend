const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",            
  password: "SWEGrp1", 
  database: "loginDB"      
});

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL (Login)");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  // Hash password with SHA-256
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  const sql = "SELECT user_id, username FROM users WHERE username = ? AND password_hash = ?";
  db.query(sql, [username, hash], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length > 0) {
      res.json({ message: "Login successful", userId: results[0].user_id });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  });
});

app.listen(3000, () =>
  console.log("Login server running on http://localhost:3000")
);