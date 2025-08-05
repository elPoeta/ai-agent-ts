import sqlite3 from "sqlite3";
//import { showLoader } from "../utils/cliUi";
import { getPath } from "../config/pathResolver"
import { promisify } from "util";

//const loader = showLoader("");

export type SqlAll = (sql: string, params?: any[]) => Promise<any[]>;

export interface SqliteDbInstance {
	all: SqlAll;
	close: () => Promise<void>;
}

export type SqliteDatabase = () => SqliteDbInstance;

export const getDb: SqliteDatabase = () => {
	const db = new sqlite3.Database(getPath("database", "alojamiento.db"));

	return {
		all: ((sql: string, params?: any[]) =>
			new Promise<any[]>((resolve, reject) => {
				db.all(sql, params || [], (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			})) as SqlAll,

		close: promisify(db.close.bind(db))
	};
};

/*
export const db = new sqlite3.Database(getPath("database", "alojamiento.db"), (err) => {
	if (err) {
		loader.fail(` Error al abrir la base de datos: ${err.message}`);
	} else {
		loader.succeed("Conectado a la base de datos SQLite.");
	}
});
*/
