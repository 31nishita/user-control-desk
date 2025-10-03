const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const DATA_DIR = path.join(__dirname, "..", ".data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance;

function getDb() {
	if (!dbInstance) {
		dbInstance = new sqlite3.Database(
			DB_PATH,
			sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
			(err) => {
				if (err) {
					console.error("Failed to open SQLite database:", DB_PATH, err.message);
				}
			}
		);
		// Apply basic pragmas to improve reliability
		dbInstance.serialize(() => {
			dbInstance.run("PRAGMA foreign_keys = ON");
			dbInstance.run("PRAGMA journal_mode = WAL");
		});
	}
	return dbInstance;
}

module.exports = { getDb, DB_PATH };


