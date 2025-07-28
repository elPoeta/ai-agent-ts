import type { ToolFn } from '../types'
import { z } from 'zod'
import type { Alojamiento } from '../../db/types';
import { queryDisponibilidad } from '../../db/search'

export const disponibilidadToolDefinition = {
	name: 'disponibilidadSearch',
	parameters: z.object({
		fechaInicio: z
			.string()
			.describe(
				'Fecha de inicio de la reserva, exactamente como fue mencionada por el usuario. No generes una nueva fecha ni modifiques el formato. Ejemplo: "2025-02-13".'
			),
		fechaFin: z
			.string()
			.describe(
				'Fecha de fin de la reserva, también tomada literalmente del mensaje del usuario. Debe ser posterior a la fecha de inicio. Ejemplo: "2025-02-21".'
			),
	}),
	description:
		'Busca la disponibilidad entre dos fechas dadas. Usa exactamente las fechas proporcionadas por el usuario sin modificarlas ni inventarlas. Devuelve ID, fecha, cabE, cabO, hab1, hab2, hab3, hab4.',
};

type Args = z.infer<typeof disponibilidadToolDefinition.parameters>

export const disponibilidadSearch: ToolFn<Args, string> = async ({ toolArgs }) => {
	const { fechaInicio, fechaFin } = toolArgs
     
	let results: Alojamiento[] = [];
	try {
		results = await queryDisponibilidad(fechaInicio, fechaFin) as Alojamiento[];
		//console.log("results ", results);
		return JSON.stringify(results, null, 2)
	} catch (error) {
		console.error("error consulta", error)
		return 'Error: No se pudo procesasr la consulta sql.'
	}

}
