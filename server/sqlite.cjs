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
		dbInstance = new sqlite3.Database(DB_PATH);
	}
	return dbInstance;
}

module.exports = { getDb, DB_PATH };


