const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { getDb } = require("./sqlite");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

// Ensure database and table exist
const db = getDb();
db.serialize(() => {
	db.run(
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		)`
	);
});

function createToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
	if (!token) return res.status(401).json({ error: "Missing token" });
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		return next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" });
	}
}

app.post("/api/auth/signup", (req, res) => {
	const { email, password, name } = req.body || {};
	if (!email || !password || !name) {
		return res.status(400).json({ error: "email, password, name are required" });
	}
	const passwordHash = bcrypt.hashSync(password, 10);
	const stmt = db.prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)");
	stmt.run(email, passwordHash, name, function (err) {
		if (err) {
			if (String(err.message || "").includes("UNIQUE")) {
				return res.status(409).json({ error: "Email already registered" });
			}
			return res.status(500).json({ error: "Failed to create user" });
		}
		const token = createToken({ id: this.lastID, email, name });
		return res.json({ token, user: { id: this.lastID, email, name } });
	});
});

app.post("/api/auth/login", (req, res) => {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return res.status(400).json({ error: "email and password are required" });
	}
	db.get("SELECT id, email, name, password_hash FROM users WHERE email = ?", [email], (err, row) => {
		if (err) return res.status(500).json({ error: "Database error" });
		if (!row) return res.status(401).json({ error: "Invalid credentials" });
		const ok = bcrypt.compareSync(password, row.password_hash);
		if (!ok) return res.status(401).json({ error: "Invalid credentials" });
		const token = createToken({ id: row.id, email: row.email, name: row.name });
		return res.json({ token, user: { id: row.id, email: row.email, name: row.name } });
	});
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
	return res.json({ user: req.user });
});

app.listen(PORT, () => {
	console.log(`API listening on http://localhost:${PORT}`);
});


