import { GoogleSheetsService } from '../gSheet/googleSheetService';
import { SQLiteSyncService, type DatabaseConfig, type SyncResult } from './sqliteSyncService';
import { config } from '../config/config';
import { getPath } from '../config/pathResolver'
import { getDb } from './connection';

export class SyncApplication {
	private sheetsService: GoogleSheetsService;
	private syncService: SQLiteSyncService;

	constructor() {
		// Configurar Google Sheets Service
		this.sheetsService = new GoogleSheetsService(config.google.spreadsheetId);

		// Configurar SQLite Database
		const dbConfig: DatabaseConfig = {
			dbPath: config.database.path,
			tableName: config.database.tableName
		};

		this.syncService = new SQLiteSyncService(dbConfig, this.sheetsService, getDb);
	}

	async initialize(): Promise<void> {
		try {
			console.log('🚀 Inicializando aplicación de sincronización...');

			// Autenticar con Google Sheets
			if (config.google.serviceAccountFile) {
				await this.sheetsService.authenticateServiceAccount(getPath("credentials", config.google.serviceAccountFile));
				console.log('✅ Autenticación con Google Sheets exitosa');
			} else if (config.google.apiKey) {
				this.sheetsService.authenticateWithApiKey(config.google.apiKey);
				console.log('✅ Autenticación con API Key exitosa');
			} else {
				throw new Error('No se encontraron credenciales de Google Sheets');
			}

			// Inicializar base de datos
			await this.syncService.initializeDatabase();
			console.log('✅ Base de datos SQLite inicializada');

		} catch (error) {
			console.error('❌ Error en inicialización:', error);
			throw error;
		}
	}

	async performSync(sheetRange: string = 'A:G'): Promise<SyncResult> {
		try {
			console.log('📊 Iniciando sincronización...');

			// Crear backup antes de sincronizar
			//const backupPath = `./backups/backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.db`;
			//await this.syncService.createBackup(backupPath);
			//console.log('💾 Backup creado');

			// Mostrar fechas existentes antes de la sync
			const existingDates = await this.syncService.getExistingDates();
			console.log(`📅 Fechas existentes en BD: ${existingDates.length}`);
			if (existingDates.length > 0) {
				console.log(`   Primera: ${existingDates[0]}, Última: ${existingDates[existingDates.length - 1]}`);
			}

			// Realizar sincronización
			const result = await this.syncService.syncFromSheets(sheetRange);

			// Mostrar resultados
			//this.displaySyncResults(result);

			return result;

		} catch (error) {
			console.error('❌ Error durante sincronización:', error);
			throw error;
		}
	}

	private displaySyncResults(result: SyncResult): void {
		console.log('\n📈 RESULTADOS DE SINCRONIZACIÓN:');
		console.log(`   Total procesadas: ${result.totalProcessed}`);
		console.log(`   ✅ Insertadas: ${result.inserted}`);
		console.log(`   ⏭️  Saltadas: ${result.skipped}`);
		console.log(`   ❌ Errores: ${result.errors.length}`);

		if (result.errors.length > 0) {
			console.log('\n🔍 DETALLES DE ERRORES:');
			result.errors.forEach((error, index) => {
				console.log(`   ${index + 1}. ${error}`);
			});
		}
	}



	public formatearResultadoSincronizacionParaLLM(result: SyncResult): string {
		const tieneErrores = result.errors.length > 0;

		const resultadoFormateado = {
			exito: !tieneErrores,
			resumen: {
				totalProcesadas: result.totalProcessed,
				insertadas: result.inserted,
				saltadas: result.skipped,
				errores: result.errors.length
			},
			mensaje: this.generarMensajeResumen(result),
			...(tieneErrores && {
				detallesErrores: result.errors.map((error, index) => ({
					numero: index + 1,
					descripcion: error
				}))
			})
		};

		return JSON.stringify(resultadoFormateado);
	}

	
	private generarMensajeResumen(result: SyncResult): string {
		if (result.errors.length > 0) {
			return `Sincronización completada con ${result.errors.length} errores. Se procesaron ${result.totalProcessed} registros: ${result.inserted} insertados y ${result.skipped} saltados.`;
		}

		if (result.inserted === 0 && result.skipped > 0) {
			return `Sincronización completada exitosamente. No se requirieron cambios - ${result.skipped} registros ya estaban actualizados.`;
		}

		return `Sincronización completada exitosamente. Se procesaron ${result.totalProcessed} registros: ${result.inserted} nuevos insertados y ${result.skipped} saltados.`;
	}

	async showDatabaseStats(): Promise<void> {
		try {
			const allRecords = await this.syncService.getAllRecords();
			console.log(`\n📊 ESTADÍSTICAS DE BASE DE DATOS:`);
			console.log(`   Total registros: ${allRecords.length}`);

			if (allRecords.length > 0) {
				// Estadísticas por campo
				const stats = {
					cabE: allRecords.filter(r => r.cabE && r.cabE.trim() !== '').length,
					cabO: allRecords.filter(r => r.cabO && r.cabO.trim() !== '').length,
					hab1: allRecords.filter(r => r.hab1 && r.hab1.trim() !== '').length,
					hab2: allRecords.filter(r => r.hab2 && r.hab2.trim() !== '').length,
					hab3: allRecords.filter(r => r.hab3 && r.hab3.trim() !== '').length,
					hab4: allRecords.filter(r => r.hab4 && r.hab4.trim() !== '').length,
				};

				console.log(`   Reservas por habitación:`);
				Object.entries(stats).forEach(([campo, count]) => {
					console.log(`     ${campo}: ${count} reservas`);
				});

				// Mostrar primeros registros como ejemplo
				console.log(`\n📝 EJEMPLOS DE REGISTROS:`);
				allRecords.slice(0, 5).forEach((record, index) => {
					console.log(`   ${index + 1}. ${record.fecha} - cabE:${record.cabE} cabO:${record.cabO} hab1:${record.hab1}`);
				});
			}
		} catch (error) {
			console.error('❌ Error al mostrar estadísticas:', error);
		}
	}

	async syncSpecificDateRange(startDate: string, endDate: string): Promise<void> {
		try {
			console.log(`\n🔍 REGISTROS ENTRE ${startDate} Y ${endDate}:`);
			const records = await this.syncService.getRecordsByDateRange(startDate, endDate);

			if (records.length === 0) {
				console.log('   No se encontraron registros en este rango');
			} else {
				records.forEach((record, index) => {
					console.log(`   ${index + 1}. ${record.fecha} - Reservas: ${[record.cabE, record.cabO, record.hab1, record.hab2, record.hab3, record.hab4]
						.filter(v => v && v.trim() !== '')
						.join(', ') || 'Ninguna'
						}`);
				});
			}
		} catch (error) {
			console.error('❌ Error al consultar rango de fechas:', error);
		}
	}

	async cleanup(): Promise<void> {
		console.log('🧹 Limpiando recursos...');
		this.syncService.close();
	}
}

async function testSync() {
	const app = new SyncApplication();

	try {
		// Inicializar aplicación
		await app.initialize();

		// Realizar sincronización
		const result = await app.performSync(`${config.sync.sheetName}!${config.sync.sheetRange}`); // Ajusta el rango según tu hoja

		// Mostrar estadísticas
		await app.showDatabaseStats();

		// Ejemplo: consultar un rango específico
		await app.syncSpecificDateRange('2024-06-15', '2024-06-20');

	} catch (error) {
		console.error('💥 Error fatal:', error);
		process.exit(1);
	} finally {
		// Limpiar recursos
		await app.cleanup();
	}
}

testSync();
