import type { SqliteDbInstance, SqliteDatabase } from './connection';
import { GoogleSheetsService } from '../gSheet/googleSheetService';

export interface SheetRow {
	fecha: string;
	cabE: string;
	cabO: string;
	hab1: string;
	hab2: string;
	hab3: string;
	hab4: string;
}

export interface SyncResult {
	totalProcessed: number;
	inserted: number;
	skipped: number;
	errors: string[];
}

export interface DatabaseConfig {
	dbPath: string;
	tableName: string;
}

class SQLiteSyncService {
	private db: SqliteDbInstance;
	private tableName: string;
	private sheetsService: GoogleSheetsService;

	constructor(
		dbConfig: DatabaseConfig,
		sheetsService: GoogleSheetsService,
		db: SqliteDatabase
	) {
		this.tableName = dbConfig.tableName;
		this.sheetsService = sheetsService;
		this.db = db();
	}

	// Inicializar la base de datos y crear tabla si no existe
	async initializeDatabase() {

		const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT UNIQUE NOT NULL,
          cabE TEXT,
          cabO TEXT,
          hab1 TEXT,
          hab2 TEXT,
          hab3 TEXT,
          hab4 TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
		await this.db.all(createTableSQL);
	}

	// Convertir fecha de formato DD/M/YYYY a formato ISO (YYYY-MM-DD)
	private parseDate(dateStr: string): string | null {
		if (!dateStr || dateStr.trim() === '') return null;

		try {
			// Parsear fecha en formato DD/M/YYYY o D/M/YYYY
			const parts = dateStr.split('/');
			if (parts.length !== 3) return null;

			const day = parts[0].padStart(2, '0');
			const month = parts[1].padStart(2, '0');
			const year = parts[2];

			// Validar que el año tenga 4 dígitos
			if (year.length !== 4) return null;

			return `${year}-${month}-${day}`;
		} catch (error) {
			console.error('Error al parsear fecha:', dateStr, error);
			return null;
		}
	}

	// Convertir fila de sheet a objeto tipado
	private parseSheetRow(row: string[], index: number): SheetRow | null {
		//if (!row || row.length < 7) {
		//	console.warn(`Fila ${index + 1}: Datos insuficientes`, row);
		//	return null;
		//	}

		const fecha = this.parseDate(row[0]);
		if (!fecha) {
			console.warn(`Fila ${index + 1}: Fecha inválida`, row[0]);
			return null;
		}

		return {
			fecha,
			cabE: row[1] || '',
			cabO: row[2] || '',
			hab1: row[3] || '',
			hab2: row[4] || '',
			hab3: row[5] || '',
			hab4: row[6] || ''
		};
	}

	// Verificar si una fecha ya existe en la base de datos
	private async dateExists(fecha: string): Promise<boolean> {
		const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE fecha = ?`;
		const row = await this.db.all(sql, [fecha]);
		return row && row.length > 0 ? row[0].count > 0 : false;

	}

	// Insertar una fila en la base de datos
	private async insertRow(row: SheetRow): Promise<void> {
		const sql = `
        INSERT INTO ${this.tableName} 
        (fecha, cabE, cabO, hab1, hab2, hab3, hab4) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

		const params = [
			row.fecha,
			row.cabE,
			row.cabO,
			row.hab1,
			row.hab2,
			row.hab3,
			row.hab4
		];

		await this.db.all(sql, params);
	}

	// Sincronizar datos desde Google Sheets
	async syncFromSheets(sheetRange: string = 'A:G'): Promise<SyncResult> {
		const result: SyncResult = {
			totalProcessed: 0,
			inserted: 0,
			skipped: 0,
			errors: []
		};

		try {
			console.log('Iniciando sincronización...');

			// Obtener datos de Google Sheets
			const rawData = await this.sheetsService.readSheet(sheetRange);

			if (!rawData || rawData.length === 0) {
				throw new Error('No se encontraron datos en Google Sheets');
			}

			// Saltar la primera fila si es el header
			const dataRows = rawData.slice(1);
			console.log(`Procesando ${dataRows.length} filas de datos`);

			for (let i = 0; i < dataRows.length; i++) {
				result.totalProcessed++;

				try {
					const parsedRow = this.parseSheetRow(dataRows[i], i);

					if (!parsedRow) {
						result.skipped++;
						continue;
					}

					// Verificar si la fecha ya existe
					const exists = await this.dateExists(parsedRow.fecha);

					if (exists) {
						console.log(`Fecha ${parsedRow.fecha} ya existe, saltando...`);
						result.skipped++;
					} else {
						// Insertar nueva fila
						await this.insertRow(parsedRow);
						result.inserted++;
					}
				} catch (error: any) {
					const errorMsg = `Error en fila ${i + 1}: ${error.message}`;
					console.error(errorMsg);
					result.errors.push(errorMsg);
				}
			}

			console.log('Sincronización completada:', result);
			return result;

		} catch (error: any) {
			const errorMsg = `Error general en sincronización: ${error.message}`;
			console.error(errorMsg);
			result.errors.push(errorMsg);
			return result;
		}
	}

	// Obtener todas las fechas existentes en la base de datos
	async getExistingDates(): Promise<string[]> {
		const sql = `SELECT fecha FROM ${this.tableName} ORDER BY fecha`;
		const rows = await this.db.all(sql, []);
		return rows.map(row => row.fecha);
	}

	// Obtener todos los registros
	async getAllRecords(): Promise<SheetRow[]> {
		const sql = `SELECT fecha, cabE, cabO, hab1, hab2, hab3, hab4 FROM ${this.tableName} ORDER BY fecha`;
		const rows = await this.db.all(sql, []);
		return rows;
	}

	// Obtener registros por rango de fechas
	async getRecordsByDateRange(startDate: string, endDate: string): Promise<SheetRow[]> {
		const sql = `
        SELECT fecha, cabE, cabO, hab1, hab2, hab3, hab4 
        FROM ${this.tableName} 
        WHERE fecha BETWEEN ? AND ? 
        ORDER BY fecha
      `;
		const rows = await this.db.all(sql, [startDate, endDate]);
		return rows;
	}

	// Limpiar todos los datos (útil para testing)
	async clearAllData(): Promise<void> {
		const sql = `DELETE FROM ${this.tableName}`;
		await this.db.all(sql, []);
	}

	// Método para hacer backup de la base de datos
	async createBackup(backupPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const fs = require('fs');
			const path = require('path');

			// Crear directorio de backup si no existe
			const backupDir = path.dirname(backupPath);
			if (!fs.existsSync(backupDir)) {
				fs.mkdirSync(backupDir, { recursive: true });
			}
			/*
						this.db.backup(backupPath, (err:any) => {
							if (err) {
								reject(err);
							} else {
								console.log(`Backup creado en: ${backupPath}`);
								resolve();
							}
						});
						*/
		});
	}

	async close() {
		await this.db.close();
	}
}

export { SQLiteSyncService };


