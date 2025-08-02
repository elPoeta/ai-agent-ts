import type { ToolFn } from '../types'
import { z } from 'zod4'
import type { Alojamiento } from '../../db/types';
import { queryDisponibilidad } from '../../db/search'
import { formatearResultadoParaLLM, validarConsulta, filtrarAlojamientosDisponibles, convertirParametrosAConsulta } from '../../utils/filter'
import { parseDateToISO } from '../../utils/dateFormatter';
/*
export const disponibilidadToolDefinition = {
	name: 'disponibilidadSearch',
	parameters: z.object({
		fechaInicio: z
			.string()
			.describe(
				'Fecha de inicio de la reserva en formato YYYY-MM-DD. Se debe convertir automáticamente desde el formato que proporcione el usuario.'
			)
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato debe ser YYYY-MM-DD'),
		fechaFin: z
			.string()
			.describe(
				'Fecha de fin de la reserva en formato YYYY-MM-DD. Se debe convertir automáticamente desde el formato que proporcione el usuario.'
			)
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato debe ser YYYY-MM-DD'),
		cantidadPersonas: z
			.number()
			.int()
			.min(1, 'La cantidad mínima es 1 persona')
			.max(6, 'La capacidad máxima es 6 personas')
			.optional()
			.describe(
				'Cantidad de personas para la reserva (opcional). Si no se especifica, se mostrarán todas las opciones disponibles. Rango válido: 1-6 personas.'
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
				hoy.setHours(0, 0, 0, 0);
				return inicio > hoy;
			},
			{
				message: 'La fecha de inicio debe ser posterior a la fecha actual',
				path: ['fechaInicio'],
			}
		),
	description: `
Busca disponibilidad de alojamientos entre fechas específicas. 
USAR SOLO cuando el usuario proporcione fechas específicas para consultar disponibilidad.
La herramienta valida fechas, filtra por cantidad de personas y devuelve alojamientos disponibles.
NO usar para preguntas generales o conversación casual.
`.trim(),
};
*/

export const disponibilidadToolDefinition = {
	name: 'busquedaDeDisponibilidad',
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
	description: `Consulta la disponibilidad de alojamientos (cabañas y habitaciones) entre dos fechas específicas. Esta herramienta permite: 
 • Buscar alojamientos disponibles en un rango de fechas determinado 
 • Filtrar resultados por cantidad de huéspedes (opcional) 
 • Obtener información detallada sobre capacidades y disponibilidad 
 • Validar automáticamente fechas y parámetros de entrada TIPOS DE ALOJAMIENTO: 
    - Cabañas: Capacidad máxima 2 personas, ideales para parejas 
 - Habitaciones: Capacidad máxima 6 personas, perfectas para familias o grupos VALIDACIONES AUTOMÁTICAS: 
    - Las fechas deben estar en formato YYYY-MM-DD - La fecha de inicio debe ser futura (posterior a hoy) 
    - La fecha de fin debe ser posterior a la fecha de inicio 
    - La cantidad de personas debe estar entre 1 y 6 RESPUESTA: Devuelve un JSON estructurado con los alojamientos disponibles, incluyendo: 
        - Tipo de alojamiento (cabaña/habitación) - Código/nombre del alojamiento 
        - Capacidad máxima 
        - Días disponibles en el período consultado 
 - Resumen de opciones disponibles Uso recomendado: Cuando el usuario mencione fechas específicas o solicite información sobre disponibilidad para hacer reservas.`.trim()
	/*
		description: `
	Busca la disponibilidad de alojamientos entre dos fechas específicas. 
	Esta herramienta:
	- Valida automáticamente que las fechas sean correctas y futuras
	- Filtra los resultados según la cantidad de personas si se especifica
	- Devuelve solo los alojamientos que estén completamente disponibles durante todo el período
	- Considera cabañas (hasta 2 personas) y habitaciones (hasta 6 personas)
	- Si no se especifica cantidad de personas, muestra todas las opciones disponibles
	
	Usa exactamente las fechas proporcionadas por el usuario sin modificarlas ni inventarlas.
	`.trim(),*/
};

type Args = z.infer<typeof disponibilidadToolDefinition.parameters>

export const busquedaDeDisponibilidad: ToolFn<Args, string> = async ({ toolArgs }) => {
	const { cantidadPersonas } = toolArgs
	const fechaInicio = parseDateToISO(toolArgs.fechaInicio);
	const fechaFin = parseDateToISO(toolArgs.fechaFin);
	if (!fechaInicio || !fechaFin) {
		return JSON.stringify({
			error: true,
			mensaje: "Error al formatear la fecha trate con el formato YYYY-MM-DD, Ejemplo: 2025-09-20",
			tipo: "parse date error"
		});
	}

	let results: Alojamiento[] = [];
	try {
		results = await queryDisponibilidad(fechaInicio, fechaFin) as Alojamiento[];
		results = results.map(a => ({ ...a, fecha: new Date(a.fecha) }));
		const consulta = convertirParametrosAConsulta({ fechaInicio, fechaFin, cantidadPersonas });
		const resultado = filtrarAlojamientosDisponibles(results, consulta);
		return formatearResultadoParaLLM(resultado, consulta);
	} catch (error) {
		console.error("error consulta", error)
		return JSON.stringify({
			error: true,
			mensaje: "No se pudo procesar la solicitad. Intentelo mas tarde.",
			tipo: "sql DB error"
		});


	}

}
