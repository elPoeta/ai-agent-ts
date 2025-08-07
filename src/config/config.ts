import '@dotenvx/dotenvx/config';

export const config = {
	ai: {
		model: process.env.MODEL || "llama3.2",
		smart: process.env.SMART === "true",
		url: process.env.URL,
		apiKey: process.env.API_KEY || "",
	},
	google: {
		spreadsheetId: process.env.GOOGLE_SHEET_ID!,
		apiKey: process.env.GOOGLE_SHEET_API_KEY,
		serviceAccountFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
	},
	database: {
		path: process.env.DATABASE_PATH || '../../database',
		tableName: process.env.TABLE_NAME || 'alojamientos',
		backupDir: process.env.BACKUP_DIR || '../../database/backups',
	},
	sync: {
		sheetName: process.env.SHEET_NAME || "alojamiento",
		sheetRange: process.env.SHEET_RANGE || "A1:Z",//'A:G' Rango por defecto
		retryAttempts: 3,
		retryDelay: 1000,
	}
};
