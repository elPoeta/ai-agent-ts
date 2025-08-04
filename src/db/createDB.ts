//import { showLoader } from "../utils/cliUi.ts";
import { getDb } from "./connection.ts";

//const loader = showLoader("Creating database...");

const db = getDb();

await db.all(
	`
    CREATE TABLE IF NOT EXISTS alojamiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT UNIQUE,
      cabE TEXT,
      cabO TEXT,
      hab1 TEXT,
      hab2 TEXT,
      hab3 TEXT,
      hab4 TEXT
    )`
);
