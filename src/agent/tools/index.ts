import { disponibilidadToolDefinition } from './busquedaDeDisponibilidad'
import { sincronizarGoogleSheetsConDatabaseToolDefinition } from './sincronizarDatabase'

export const tools = [disponibilidadToolDefinition, sincronizarGoogleSheetsConDatabaseToolDefinition]
