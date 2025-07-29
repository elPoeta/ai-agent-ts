import type { Alojamiento } from '../db/types'
import { disponibilidadToolDefinition } from '../agent/tools/disponibilidadSearch'
import { z } from 'zod'

export interface AlojamientoDisponible {
	tipo: 'cabaña' | 'habitacion';
	codigo: string;
	capacidadMaxima: number;
	diasDisponibles: Date[];
}

export interface ConsultaDisponibilidad {
	fechaInicio: Date;
	fechaFin: Date;
	cantidadPersonas?: number;
}

export interface ValidationError {
	tipo: 'fecha_invalida' | 'fecha_pasada' | 'personas_invalidas';
	mensaje: string;
}


// Tipos para usar con el tool
export interface DisponibilidadSearchParams {
	fechaInicio: string;
	fechaFin: string;
	cantidadPersonas?: number;
}

// Función helper para validar los parámetros antes de usar el tool
export function validarParametrosDisponibilidad(params: DisponibilidadSearchParams): {
	valid: boolean;
	errors?: string[];
} {
	try {
		disponibilidadToolDefinition.parameters.parse(params);
		return { valid: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				valid: false,
				errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
			};
		}
		return {
			valid: false,
			errors: ['Error de validación desconocido']
		};
	}
}

// Función helper para convertir strings de fecha a objetos Date
export function convertirParametrosAConsulta(params: DisponibilidadSearchParams): {
	fechaInicio: Date;
	fechaFin: Date;
	cantidadPersonas?: number;
} {
	return {
		fechaInicio: new Date(params.fechaInicio),
		fechaFin: new Date(params.fechaFin),
		cantidadPersonas: params.cantidadPersonas
	};
}

/**
 * Valida los parámetros de la consulta
 */
export function validarConsulta(consulta: ConsultaDisponibilidad): ValidationError | null {
	const { fechaInicio, fechaFin, cantidadPersonas } = consulta;
	const ahora = new Date();
	// Validar que fecha inicio sea mayor que fecha fin
	if (fechaInicio >= fechaFin) {
		return {
			tipo: 'fecha_invalida',
			mensaje: 'La fecha de inicio debe ser anterior a la fecha de fin'
		};
	}

	// Validar que fecha inicio sea mayor que la actual
	if (fechaInicio <= ahora) {
		return {
			tipo: 'fecha_pasada',
			mensaje: 'La fecha de inicio debe ser posterior a la fecha actual'
		};
	}

	// Validar cantidad de personas si se especifica
	if (cantidadPersonas !== null && cantidadPersonas !== undefined && (cantidadPersonas < 1 || cantidadPersonas > 6)) {
		return {
			tipo: 'personas_invalidas',
			mensaje: 'La cantidad de personas debe estar entre 1 y 6'
		};
	}

	return null;
}

/**
 * Verifica si un campo está disponible (vacío, null, undefined o string vacío)
 */
function estaDisponible(campo: string): boolean {
	return !campo || campo.trim() === '';
}

/**
 * Obtiene todas las fechas entre dos fechas (inclusive)
 */
function obtenerFechasEnRango(fechaInicio: Date, fechaFin: Date): Date[] {
	const fechas: Date[] = [];
	const fechaActual = new Date(fechaInicio);

	while (fechaActual <= fechaFin) {
		fechas.push(new Date(fechaActual));
		fechaActual.setDate(fechaActual.getDate() + 1);
	}
	return fechas;
}

/**
 * Verifica si un alojamiento específico está disponible todos los días del rango
 */
function verificarDisponibilidadCompleta(
	alojamientos: Alojamiento[],
	campo: keyof Pick<Alojamiento, 'cabE' | 'cabO' | 'hab1' | 'hab2' | 'hab3' | 'hab4'>,
	fechasRequeridas: Date[]
): boolean {
	for (const fechaRequerida of fechasRequeridas) {
		const registro = alojamientos.find(a =>
			a.fecha.toDateString() === fechaRequerida.toDateString()
		);

		if (!registro || !estaDisponible(registro[campo])) {
			return false;
		}
	}

	return true;
}

/**
 * Filtra los alojamientos disponibles según los criterios especificados
 */
export function filtrarAlojamientosDisponibles(
	alojamientos: Alojamiento[],
	consulta: ConsultaDisponibilidad
): { error?: ValidationError; disponibles: AlojamientoDisponible[] } {

	// Validar consulta
	const error = validarConsulta(consulta);
	if (error) {
		return { error, disponibles: [] };
	}

	const { fechaInicio, fechaFin, cantidadPersonas } = consulta;
	const fechasRequeridas = obtenerFechasEnRango(fechaInicio, fechaFin);
	const alojamientosDisponibles: AlojamientoDisponible[] = [];

	// Definir qué campos verificar según la cantidad de personas
	let camposAVerificar: Array<{
		campo: keyof Pick<Alojamiento, 'cabE' | 'cabO' | 'hab1' | 'hab2' | 'hab3' | 'hab4'>;
		codigo: string;
		tipo: 'cabaña' | 'habitacion';
		capacidad: number;
	}>;

	if (cantidadPersonas === undefined) {
		// Sin especificar personas: verificar todos
		camposAVerificar = [
			{ campo: 'cabE', codigo: 'Cabaña Este', tipo: 'cabaña', capacidad: 2 },
			{ campo: 'cabO', codigo: 'Cabaña Oeste', tipo: 'cabaña', capacidad: 2 },
			{ campo: 'hab1', codigo: 'Habitación 1', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab2', codigo: 'Habitación 2', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab3', codigo: 'Habitación 3', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab4', codigo: 'Habitación 4', tipo: 'habitacion', capacidad: 6 }
		];
	} else if (cantidadPersonas <= 2) {
		// 1-2 personas: cabañas y habitaciones
		camposAVerificar = [
			{ campo: 'cabE', codigo: 'Cabaña Este', tipo: 'cabaña', capacidad: 2 },
			{ campo: 'cabO', codigo: 'Cabaña Oeste', tipo: 'cabaña', capacidad: 2 },
			{ campo: 'hab1', codigo: 'Habitación 1', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab2', codigo: 'Habitación 2', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab3', codigo: 'Habitación 3', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab4', codigo: 'Habitación 4', tipo: 'habitacion', capacidad: 6 }
		];
	} else {
		// Más de 2 personas: solo habitaciones
		camposAVerificar = [
			{ campo: 'hab1', codigo: 'Habitación 1', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab2', codigo: 'Habitación 2', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab3', codigo: 'Habitación 3', tipo: 'habitacion', capacidad: 6 },
			{ campo: 'hab4', codigo: 'Habitación 4', tipo: 'habitacion', capacidad: 6 }
		];
	}

	// Verificar disponibilidad de cada campo
	for (const { campo, codigo, tipo, capacidad } of camposAVerificar) {
		if (verificarDisponibilidadCompleta(alojamientos, campo, fechasRequeridas)) {
			alojamientosDisponibles.push({
				tipo,
				codigo,
				capacidadMaxima: capacidad,
				diasDisponibles: [...fechasRequeridas]
			});
		}
	}

	return { disponibles: alojamientosDisponibles };
}

/**
 * Función de utilidad para formatear el resultado para la LLM
 */
export function formatearResultadoParaLLM(
	resultado: { error?: ValidationError; disponibles: AlojamientoDisponible[] },
	consulta: ConsultaDisponibilidad
): string {
	if (resultado.error) {
		return JSON.stringify({
			error: true,
			mensaje: resultado.error.mensaje,
			tipo: resultado.error.tipo
		});
	}

	if (resultado.disponibles.length === 0) {
		return JSON.stringify({
			error: false,
			mensaje: 'No hay alojamientos disponibles para las fechas solicitadas',
			disponibles: []
		});
	}

	return JSON.stringify({
		error: false,
		consulta: {
			fechaInicio: consulta.fechaInicio.toISOString().split('T')[0],
			fechaFin: consulta.fechaFin.toISOString().split('T')[0],
			cantidadPersonas: consulta.cantidadPersonas,
			diasSolicitados: resultado.disponibles[0].diasDisponibles.length
		},
		disponibles: resultado.disponibles.map(aloj => ({
			tipo: aloj.tipo,
			codigo: aloj.codigo,
			capacidadMaxima: aloj.capacidadMaxima,
			cantidadDias: aloj.diasDisponibles.length
		}))
	});
}
