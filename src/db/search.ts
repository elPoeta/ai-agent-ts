/*
import { db } from './connection';

export const queryDisponibilidad = async (fechaInicio: string, fechaFin: string) => {
	const sql = `SELECT * FROM alojamiento WHERE fecha BETWEEN ? AND ?`;
	return new Promise((resolve, reject) => {
		db.all(sql, [fechaInicio, fechaFin], (err, rows) => {
			if (err) {
				console.log("error all", err)
				reject([]);
			} else {
				//console.log('rows', rows);
				resolve(rows);
			}
		});
	});
}
*/
