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
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
	supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

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
	
	// Create password reset tokens table
	db.run(
		`CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token TEXT UNIQUE NOT NULL,
			expires_at TEXT NOT NULL,
			used BOOLEAN DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			FOREIGN KEY (user_id) REFERENCES users(id)
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

// Password reset request endpoint
app.post("/api/auth/forgot-password", (req, res) => {
	const { email } = req.body || {};
	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}
	
	// Check if user exists
	db.get("SELECT id, email, name FROM users WHERE email = ?", [email], (err, user) => {
		if (err) {
			return res.status(500).json({ error: "Database error" });
		}
		
		if (!user) {
			// Don't reveal if email exists or not for security
			return res.json({ message: "If the email exists, a reset link has been sent" });
		}
		
		// Generate reset token (simple random string for demo)
		const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
		
		// Store reset token
		const stmt = db.prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
		stmt.run(user.id, resetToken, expiresAt, function (err) {
			if (err) {
				return res.status(500).json({ error: "Failed to create reset token" });
			}
			
			// In a real app, you would send an email here
			// For demo purposes, we'll return the token (NEVER do this in production!)
            return res.json({ 
                message: "Password reset requested successfully",
                // DEMO ONLY - In production, send this via email instead
                resetToken: resetToken,
                resetUrl: `${FRONTEND_URL}/reset-password?token=${resetToken}`,
                expires: expiresAt
            });
		});
	});
});

// Password reset endpoint
app.post("/api/auth/reset-password", (req, res) => {
	const { token, newPassword } = req.body || {};
	if (!token || !newPassword) {
		return res.status(400).json({ error: "Token and new password are required" });
	}
	
	if (newPassword.length < 6) {
		return res.status(400).json({ error: "Password must be at least 6 characters" });
	}
	
	// Find valid reset token
	db.get(
		`SELECT prt.*, u.id as user_id, u.email, u.name 
		 FROM password_reset_tokens prt 
		 JOIN users u ON prt.user_id = u.id 
		 WHERE prt.token = ? AND prt.used = 0 AND datetime(prt.expires_at) > datetime('now')`,
		[token],
		(err, tokenRow) => {
			if (err) {
				return res.status(500).json({ error: "Database error" });
			}
			
			if (!tokenRow) {
				return res.status(400).json({ error: "Invalid or expired reset token" });
			}
			
			// Hash new password
			const newPasswordHash = bcrypt.hashSync(newPassword, 10);
			
			// Update password
			db.run(
				"UPDATE users SET password_hash = ? WHERE id = ?",
				[newPasswordHash, tokenRow.user_id],
				(err) => {
					if (err) {
						return res.status(500).json({ error: "Failed to update password" });
					}
					
					// Mark token as used
					db.run(
						"UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
						[tokenRow.id],
						(err) => {
							if (err) {
								console.error("Failed to mark token as used:", err);
							}
							
							return res.json({ 
								message: "Password reset successful",
								user: { id: tokenRow.user_id, email: tokenRow.email, name: tokenRow.name }
							});
						}
					);
				}
			);
		}
	);
});

// Get active reset tokens (for testing/debugging)
app.get("/api/auth/reset-tokens", (req, res) => {
	db.all(
		`SELECT prt.token, prt.expires_at, prt.used, prt.created_at, u.email 
		 FROM password_reset_tokens prt 
		 JOIN users u ON prt.user_id = u.id 
		 WHERE prt.used = 0 AND datetime(prt.expires_at) > datetime('now')
		 ORDER BY prt.created_at DESC`,
		[],
		(err, tokens) => {
			if (err) {
				return res.status(500).json({ error: "Database error" });
			}
			return res.json({ tokens: tokens || [] });
		}
	);
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

// Migrate existing SQLite users to Supabase (admin)
app.post("/api/supabase/migrate", async (_req, res) => {
	try {
		if (!supabaseAdmin) {
			return res.status(500).json({ error: "Supabase service role not configured on server" });
		}
		// Read all users from SQLite
		db.all("SELECT id, email, name FROM users ORDER BY id ASC", [], async (err, rows) => {
			if (err) return res.status(500).json({ error: "Failed to read SQLite users" });
			const results = [];
			for (const row of rows || []) {
				try {
					// Create auth user if not exists
					const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
					const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
						email: row.email,
						password: tempPassword,
						email_confirm: true,
						user_metadata: { name: row.name },
					});
					if (createErr && !String(createErr.message || "").includes("already registered")) {
						throw createErr;
					}
					const userId = created?.user?.id;
					// Upsert profile
					const { error: upsertErr } = await supabaseAdmin
						.from("profiles")
						.upsert({
							id: userId,
							user_id: userId,
							email: row.email,
							name: row.name,
							role: "user",
							status: "active",
						})
						.select()
						.single();
					if (upsertErr) throw upsertErr;
					results.push({ email: row.email, ok: true });
				} catch (e) {
					results.push({ email: row.email, ok: false, error: String(e?.message || e) });
				}
			}
			return res.json({ migrated: results.filter(r => r.ok).length, total: rows.length, results });
		});
	} catch (e) {
		return res.status(500).json({ error: "Unexpected server error" });
	}
});

app.listen(PORT, HOST, () => {
	console.log(`API listening on http://${HOST}:${PORT} (db: ${DB_PATH})`);
});


