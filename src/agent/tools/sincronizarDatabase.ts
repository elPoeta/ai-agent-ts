import { z } from 'zod4'
import type { ToolFn } from '../types'
import { SyncApplication } from '../../db/syncDB'
import { config } from '../../config/config'

export const sincronizarGoogleSheetsConDatabaseToolDefinition = {
	name: 'sincronizar_google_sheets_con_database',
	parameters: z.object({}),
	description: `Sincroniza automáticamente Google Sheets con la base de datos del sistema.
	
Funcionalidades:
- Actualiza la base de datos con los últimos datos de Google Sheets
- Mantiene consistencia entre ambas fuentes de datos

Usar cuando el usuario solicite:
- "sincronizar base de datos"
- "actualizar datos desde Google Sheets" 
- "reflejar cambios de la hoja en el sistema"
- Resolver discrepancias entre datos`.trim()
}

type Args = z.infer<typeof sincronizarGoogleSheetsConDatabaseToolDefinition.parameters>

export const sincronizarGoogleSheetsConDatabase: ToolFn<Args, string> = async ({ toolArgs }): Promise<string> => {
	console.log('🔄 INICIANDO SINCRONIZACIÓN - Tool ejecutada correctamente');

	const syncApp = new SyncApplication();

	try {
		await syncApp.initialize();
		console.log('✅ SyncApplication inicializada');

		const result = await syncApp.performSync(`${config.sync.sheetName}!${config.sync.sheetRange}`);
		console.log("📊 Resultados sincronización:", result);

		return syncApp.formatearResultadoSincronizacionParaLLM(result);
	} catch (error: any) {
		console.error('❌ Error en sincronización:', error);
		return JSON.stringify({
			exito: false,
			error: true,
			mensaje: `Error durante la sincronización: ${error.message}`,
			resumen: {
				totalProcesadas: 0,
				insertadas: 0,
				saltadas: 0,
				errores: 1
			}
		});
	}
}


