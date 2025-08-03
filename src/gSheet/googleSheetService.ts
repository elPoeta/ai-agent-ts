import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Tipos para mejor tipado
interface SheetData {
	range: string;
	majorDimension: string;
	values: string[][];
}

interface ServiceAccountCredentials {
	type: string;
	project_id: string;
	private_key_id: string;
	private_key: string;
	client_email: string;
	client_id: string;
	auth_uri: string;
	token_uri: string;
	auth_provider_x509_cert_url: string;
	client_x509_cert_url: string;
}

class GoogleSheetsService {
	private sheets: any;
	private spreadsheetId: string;

	constructor(spreadsheetId: string) {
		this.spreadsheetId = spreadsheetId;
	}

	// Método 1: Autenticación con Service Account (recomendado para aplicaciones)
	async authenticateServiceAccount(credentialsPath: string): Promise<void> {
		try {
			const credentials: ServiceAccountCredentials = JSON.parse(
				fs.readFileSync(credentialsPath, 'utf8')
			);

			const auth = new google.auth.GoogleAuth({
				credentials,
				scopes: ['https://www.googleapis.com/auth/spreadsheets'],
			});

			const authClient = await auth.getClient();

			//@ts-expect-error
			this.sheets = google.sheets({ version: 'v4', auth: authClient });

			console.log('Autenticación exitosa con Service Account');
		} catch (error) {
			console.error('Error en autenticación:', error);
			throw error;
		}
	}

	// Método 2: Autenticación con API Key (solo lectura)
	authenticateWithApiKey(apiKey: string): void {
		this.sheets = google.sheets({
			version: 'v4',
			auth: apiKey,
		});
		console.log('Autenticación exitosa con API Key');
	}

	// Leer datos de una hoja
	async readSheet(range: string = 'A1:Z1000'): Promise<string[][]> {
		try {
			const response = await this.sheets.spreadsheets.values.get({
				spreadsheetId: this.spreadsheetId,
				range,
			});

			const rows = response.data.values;
			if (!rows || rows.length === 0) {
				console.log('No se encontraron datos.');
				return [];
			}

			console.log(`Se encontraron ${rows.length} filas`);
			return rows;
		} catch (error) {
			console.error('Error al leer la hoja:', error);
			throw error;
		}
	}

	// Escribir datos en una hoja
	async writeSheet(range: string, values: string[][]): Promise<void> {
		try {
			const response = await this.sheets.spreadsheets.values.update({
				spreadsheetId: this.spreadsheetId,
				range,
				valueInputOption: 'RAW',
				resource: {
					values,
				},
			});

			console.log(`${response.data.updatedCells} celdas actualizadas`);
		} catch (error) {
			console.error('Error al escribir en la hoja:', error);
			throw error;
		}
	}

	// Agregar datos al final de la hoja
	async appendData(range: string, values: string[][]): Promise<void> {
		try {
			const response = await this.sheets.spreadsheets.values.append({
				spreadsheetId: this.spreadsheetId,
				range,
				valueInputOption: 'RAW',
				resource: {
					values,
				},
			});

			console.log(`${response.data.updates?.updatedCells} celdas agregadas`);
		} catch (error) {
			console.error('Error al agregar datos:', error);
			throw error;
		}
	}

	// Limpiar un rango
	async clearRange(range: string): Promise<void> {
		try {
			await this.sheets.spreadsheets.values.clear({
				spreadsheetId: this.spreadsheetId,
				range,
			});

			console.log(`Rango ${range} limpiado`);
		} catch (error) {
			console.error('Error al limpiar rango:', error);
			throw error;
		}
	}

	// Obtener información de la hoja
	async getSheetInfo(): Promise<any> {
		try {
			const response = await this.sheets.spreadsheets.get({
				spreadsheetId: this.spreadsheetId,
			});

			return response.data;
		} catch (error) {
			console.error('Error al obtener información de la hoja:', error);
			throw error;
		}
	}
}

// Ejemplo de uso
async function main() {
	try {
		// Reemplaza con tu ID de Google Sheets
		const spreadsheetId = process.env.GOOGLE_SHEET_ID;
		const sheetsService = new GoogleSheetsService(spreadsheetId!);

		// Opción 1: Usar Service Account
		await sheetsService.authenticateServiceAccount('./hoster-ai-cred.json');

		// Opción 2: Usar API Key (solo para lectura)
		// sheetsService.authenticateWithApiKey('TU_API_KEY_AQUI');

		// Leer datos
		const data = await sheetsService.readSheet('Hoja1!A1:D10');
		console.log('Datos leídos:', data);



	} catch (error) {
		console.error('Error en main:', error);
	}
}


main();


export { GoogleSheetsService };

// Configuración adicional para manejo de errores y reintentos
class GoogleSheetsServiceWithRetry extends GoogleSheetsService {
	private maxRetries: number = 3;
	private retryDelay: number = 1000;

	async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
		let lastError: any;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error: any) {
				lastError = error;

				if (attempt === this.maxRetries) {
					throw error;
				}

				// Si es un error de cuota, esperar más tiempo
				if (error.code === 429) {
					const delay = this.retryDelay * Math.pow(2, attempt - 1);
					console.log(`Límite de cuota alcanzado. Reintentando en ${delay}ms...`);
					await this.sleep(delay);
				} else {
					console.log(`Intento ${attempt} falló. Reintentando...`);
					await this.sleep(this.retryDelay);
				}
			}
		}

		throw lastError;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Override de métodos principales con retry
	async readSheet(range: string = 'A1:Z1000'): Promise<string[][]> {
		return this.retryOperation(() => super.readSheet(range));
	}

	async writeSheet(range: string, values: string[][]): Promise<void> {
		return this.retryOperation(() => super.writeSheet(range, values));
	}
}
