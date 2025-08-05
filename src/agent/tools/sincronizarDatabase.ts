import { z } from 'zod4'
import type { ToolFn } from '../types'
import { SyncApplication } from '../../db/syncDB'
import { config } from '../../config/config'

export const sincronizarGoogleSheetsConDatabaseToolDefinition = {
    name: 'sincronizarGoogleSheetsConDatabase',
    parameters: z.object({}),
    description: `Sincroniza automáticamente el contenido de Google Sheets con la base de datos del sistema. 
    Esta función ejecuta un proceso de sincronización unidireccional que actualiza la base de datos con los ultimos datos de la hoja de cálculo para mantener la consistencia de datos entre ambas fuentes. 
    No requiere parámetros ya que utiliza la configuración predefinida del sistema para identificar las hojas y tablas a sincronizar.`.trim()
}


type Args = z.infer<typeof sincronizarGoogleSheetsConDatabaseToolDefinition.parameters>


export const sincronizarGoogleSheetsConDatabase: ToolFn<Args, string> = async ({ }): Promise<string> => {
    const syncApp = new SyncApplication();
    try {
        await syncApp.initialize();

        // Realizar sincronización
        const result = await syncApp.performSync(`${config.sync.sheetName}!${config.sync.sheetRange}`);

        // Ahora displaySyncResults devuelve el string formateado
        return syncApp.formatearResultadoSincronizacionParaLLM(result);

    } catch (error: any) {
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

