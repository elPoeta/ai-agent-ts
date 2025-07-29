import type { ToolFn } from '../types'
import { z } from 'zod'
import type { Alojamiento } from '../../db/types';
import { queryDisponibilidad } from '../../db/search'
import { formatearResultadoParaLLM, validarConsulta, filtrarAlojamientosDisponibles, convertirParametrosAConsulta } from '../../utils/filter'

export const disponibilidadToolDefinition = {
	name: 'disponibilidadSearch',
	parameters: z.object({
		fechaInicio: z
			.string()
			.describe(
				'Fecha de inicio de la reserva en formato YYYY-MM-DD, exactamente como fue mencionada por el usuario. No generes una nueva fecha ni modifiques el formato. Ejemplo: "2025-02-13".'
			)
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato debe ser YYYY-MM-DD'),

		fechaFin: z
			.string()
			.describe(
				'Fecha de fin de la reserva en formato YYYY-MM-DD, también tomada literalmente del mensaje del usuario. Debe ser posterior a la fecha de inicio. Ejemplo: "2025-02-21".'
			)
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato debe ser YYYY-MM-DD'),

		cantidadPersonas: z
			.number()
			.int()
			.min(1, 'La cantidad mínima es 1 persona')
			.max(6, 'La capacidad máxima es 6 personas')
			.optional()
			.describe(
				'Cantidad de personas para la reserva (opcional). Si no se especifica, se mostrarán todas las opciones disponibles. Rango válido: 1-6 personas. Las cabañas son para máximo 2 personas, las habitaciones para máximo 6.'
			),
	})
		.refine(
			(data) => {
				const inicio = new Date(data.fechaInicio);
				const fin = new Date(data.fechaFin);
				return inicio < fin;
			},
			{
				message: 'La fecha de inicio debe ser anterior a la fecha de fin',
				path: ['fechaFin'],
			}
		)
		.refine(
			(data) => {
				const inicio = new Date(data.fechaInicio);
				const hoy = new Date();
				hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
				return inicio > hoy;
			},
			{
				message: 'La fecha de inicio debe ser posterior a la fecha actual',
				path: ['fechaInicio'],
			}
		),

	description: `
Busca la disponibilidad de alojamientos entre dos fechas específicas. 
Esta herramienta:
- Valida automáticamente que las fechas sean correctas y futuras
- Filtra los resultados según la cantidad de personas si se especifica
- Devuelve solo los alojamientos que estén completamente disponibles durante todo el período
- Considera cabañas (hasta 2 personas) y habitaciones (hasta 6 personas)
- Si no se especifica cantidad de personas, muestra todas las opciones disponibles

Usa exactamente las fechas proporcionadas por el usuario sin modificarlas ni inventarlas.
`.trim(),
};

type Args = z.infer<typeof disponibilidadToolDefinition.parameters>

export const disponibilidadSearch: ToolFn<Args, string> = async ({ toolArgs }) => {
	const { fechaInicio, fechaFin } = toolArgs

	let results: Alojamiento[] = [];
	try {
		results = await queryDisponibilidad(fechaInicio, fechaFin) as Alojamiento[];
		results = results.map(a => ({ ...a, fecha: new Date(a.fecha) }));
		const consulta = convertirParametrosAConsulta(toolArgs);
		const resultado = filtrarAlojamientosDisponibles(results, consulta);
		return formatearResultadoParaLLM(resultado, consulta);
	} catch (error) {
		console.error("error consulta", error)
		return 'Error: No se pudo procesasr la consulta sql.'
		//return formatearResultadoParaLLM([], "");
	}

}
