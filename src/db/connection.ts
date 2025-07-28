import sqlite3 from "sqlite3";
import { showLoader } from "../utils/cliUi";

const loader = showLoader("");

export const db = new sqlite3.Database("alojamiento.db", (err) => {
	if (err) {
		loader.fail(` Error al abrir la base de datos: ${err.message}`);
	} else {
		loader.succeed("Conectado a la base de datos SQLite.");
	}
});
