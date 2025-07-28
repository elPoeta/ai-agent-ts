import { showLoader } from "../utils/cliUi.ts";
import { db } from "./connection.ts";

const loader = showLoader("Creating database...");

db.run(
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
    )
  `,
  (err) => {
    if (err) {
      loader.fail(`Table creation failed: ${err.message}`);
    } else {
      loader.succeed("✅ Database created successfully.");
    }
  },
);
