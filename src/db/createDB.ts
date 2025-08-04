import { showLoader } from "../utils/cliUi.ts";
import { getDb as db } from "./connection.ts";

//const loader = showLoader("Creating database...");

await db().all(
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
