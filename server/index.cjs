const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { getDb, DB_PATH } = require("./sqlite.cjs");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

// Initialize Supabase admin client (service role)
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
	supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

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

	// Conditionally add columns if missing to avoid ALTER errors
	db.all("PRAGMA table_info(users)", [], (err, rows) => {
		if (err) {
			console.error("Failed to read users schema:", err.message);
			return;
		}
		const existing = Array.isArray(rows) ? rows.map((r) => r.name) : [];
		const hasStatus = existing.includes("status");
		const hasIsActive = existing.includes("is_active");
		if (!hasStatus) {
			db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'", () => {});
		}
		if (!hasIsActive) {
			db.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 0", () => {});
		}
	});
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

// Lightweight health endpoint
app.get("/health", (_req, res) => {
	return res.json({ ok: true });
});

// Supabase configuration status endpoint
app.get("/api/supabase/status", (_req, res) => {
	const configured = Boolean(SUPABASE_URL) && Boolean(SUPABASE_SERVICE_ROLE_KEY);
	return res.json({ ok: true, configured, url: SUPABASE_URL || null, serviceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY) });
});

// Supabase stats endpoint (uses service role)
app.get("/api/supabase/stats", async (_req, res) => {
	try {
		if (!supabaseAdmin) {
			return res.status(503).json({ error: "Supabase not configured on server" });
		}
		const totalResp = await supabaseAdmin
			.from("profiles")
			.select("*", { count: "exact", head: true });
		const activeResp = await supabaseAdmin
			.from("profiles")
			.select("*", { count: "exact", head: true })
			.eq("status", "active");
		const pendingResp = await supabaseAdmin
			.from("profiles")
			.select("*", { count: "exact", head: true })
			.eq("status", "pending");

		if (totalResp.error || activeResp.error || pendingResp.error) {
			const msg = totalResp.error?.message || activeResp.error?.message || pendingResp.error?.message || "Unknown Supabase error";
			return res.status(500).json({ error: msg });
		}

		return res.json({
			totalUsers: totalResp.count || 0,
			activeSessions: activeResp.count || 0,
			pendingActions: pendingResp.count || 0,
		});
	} catch (e) {
		return res.status(500).json({ error: "Unexpected server error" });
	}
});

// Create Supabase user (admin) and profile
app.post("/api/supabase/users", async (req, res) => {
	try {
		if (!supabaseAdmin) {
			return res.status(500).json({ error: "Supabase service role not configured on server" });
		}
		const { name, email, role, status, phone } = req.body || {};
		if (!name || !email) {
			return res.status(400).json({ error: "name and email required" });
		}
		const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
		const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: tempPassword,
			email_confirm: true,
			user_metadata: { name },
		});
		if (createErr) {
			return res.status(400).json({ error: createErr.message });
		}
		const createdUser = created?.user;
		if (!createdUser) {
			return res.status(500).json({ error: "Failed to create Supabase user" });
		}
		const profile = {
			id: createdUser.id,
			user_id: createdUser.id,
			name,
			email,
			role: role || "user",
			status: status || "active",
			phone: phone || null,
			updated_at: new Date().toISOString(),
		};
		const { data: upserted, error: upsertErr } = await supabaseAdmin
			.from("profiles")
			.upsert(profile)
			.select()
			.single();
		if (upsertErr) {
			return res.status(500).json({ error: upsertErr.message });
		}
		return res.status(201).json({ user: createdUser, profile: upserted || profile });
	} catch (e) {
		return res.status(500).json({ error: "Unexpected server error" });
	}
});

app.get("/api/stats", (_req, res) => {
	const stats = { totalUsers: 0, activeSessions: 0, pendingActions: 0 };
	const queries = [
		{
			key: "totalUsers",
			sql: "SELECT COUNT(*) as c FROM users",
			params: [],
		},
		{
			key: "activeSessions",
			sql: "SELECT COUNT(*) as c FROM users WHERE is_active = 1",
			params: [],
		},
		{
			key: "pendingActions",
			sql: "SELECT COUNT(*) as c FROM users WHERE status = 'pending'",
			params: [],
		},
	];

	let remaining = queries.length;
	queries.forEach(({ key, sql, params }) => {
		db.get(sql, params, (err, row) => {
			if (!err && row && typeof row.c === "number") stats[key] = row.c;
			remaining -= 1;
			if (remaining === 0) return res.json(stats);
		});
	});
});

// Users CRUD
app.get("/api/users", (_req, res) => {
	db.all(
		"SELECT id, email, name, status, is_active as isActive, created_at as createdAt FROM users ORDER BY created_at DESC",
		[],
		(err, rows) => {
			if (err) return res.status(500).json({ error: "Database error" });
			return res.json(rows || []);
		}
	);
});

app.post("/api/users", (req, res) => {
	const { name, email, phone, role, status } = req.body || {};
	if (!name || !email) return res.status(400).json({ error: "name and email required" });
	const passwordHash = bcrypt.hashSync("changeme123", 10);
	const isActive = status === "active" ? 1 : 0;
	const stmt = db.prepare(
		"INSERT INTO users (email, password_hash, name, created_at, is_active) VALUES (?, ?, ?, datetime('now'), ?)"
	);
	stmt.run(email, passwordHash, name, isActive, function (err) {
		if (err) {
			if (String(err.message || "").includes("UNIQUE")) {
				return res.status(409).json({ error: "Email already exists" });
			}
			return res.status(500).json({ error: "Failed to create user" });
		}
		db.get("SELECT id, email, name, is_active as isActive, created_at as createdAt FROM users WHERE id = ?", [this.lastID], (e, row) => {
			if (e) return res.status(201).json({ id: this.lastID, email, name, isActive, createdAt: new Date().toISOString() });
			return res.status(201).json(row);
		});
	});
});

app.put("/api/users/:id", (req, res) => {
	const { id } = req.params;
	const { name, email, role, status, phone } = req.body || {};
	const isActive = status === "active" ? 1 : 0;
	const stmt = db.prepare("UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), is_active = ?, status = COALESCE(?, status) WHERE id = ?");
	stmt.run(name, email, isActive, status, id, function (err) {
		if (err) return res.status(500).json({ error: "Failed to update user" });
		return res.json({ updated: this.changes });
	});
});

app.delete("/api/users/:id", (req, res) => {
	const { id } = req.params;
	const stmt = db.prepare("DELETE FROM users WHERE id = ?");
	stmt.run(id, function (err) {
		if (err) return res.status(500).json({ error: "Failed to delete user" });
		return res.json({ deleted: this.changes });
	});
});

app.listen(PORT, HOST, () => {
	console.log(`API listening on http://${HOST}:${PORT} (db: ${DB_PATH})`);
});


