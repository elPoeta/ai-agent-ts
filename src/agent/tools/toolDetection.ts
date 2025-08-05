function requiresAvailabilitySearch(message: string) {
	const availabilityKeywords = [
		'disponibilidad', 'disponible', 'libre', 'reservar', 'reserva',
		'fechas', 'fecha', 'cabaña', 'cabañas', 'habitación', 'habitaciones',
		'alojamiento', 'hospedaje', 'estadía', 'estancia', 'noches', 'personas', 'sync',
		'sincronizar', 'sincroniza', 'actualiza', 'actualizar', 'db', 'bd', 'base de datos', 'sheet', 'sheets', 'hoja de calculo'
	];
	const availabilitySyncKeywords = [
		'sync', 'sincronizar', 'sincroniza', 'actualiza', 'actualizar', 'db', 'bd',
		'base de datos', 'sheet', 'sheets', 'hoja de calculo'
	];

	const messageLower = message.toLowerCase();

	// Verificar palabras clave de disponibilidad
	const hasKeywords = availabilityKeywords.some(keyword =>
		messageLower.includes(keyword)
	);

	const hasSyncKeywords = availabilitySyncKeywords.some(keyword =>
		messageLower.includes(keyword)
	);

	// Verificar patrones de fechas
	const datePatterns = [
		/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,  // YYYY-MM-DD o YYYY/MM/DD
		/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/, // DD-MM-YYYY o DD/MM/YYYY o DD-MM-YY
		/desde.*hasta/i,                   // "desde X hasta Y"
		/del.*al/i,                        // "del X al Y"
		/entre.*y/i                        // "entre X y Y"
	];

	const hasDates = datePatterns.some(pattern => pattern.test(message));

	// Solo considerar que requiere tool si tiene AMBOS: keywords Y fechas
	return hasSyncKeywords || (hasKeywords && hasDates);
}

function requiresAvailabilitySearchStrict(message: string) {
	const messageLower = message.toLowerCase();

	// Patrones más específicos para consultas de disponibilidad
	const availabilityPatterns = [
		/disponibilidad.*entre.*y/i,
		/disponible.*del.*al/i,
		/reservar.*desde.*hasta/i,
		/libre.*\d{1,2}[-\/]\d{1,2}/i,
		/cabaña.*disponible.*\d{4}/i,
		/habitación.*libre.*\d{4}/i,
		/consultar.*fechas/i,
		/verificar.*disponibilidad/i,
		/(quiero|necesito|busco).*(reservar|reserva)/i,
		/(personas|somos).*\d/i,
		/(sync|sincronizar|sincroniza|actualizar|actualiza|base de datos|bd|db).*/i,
		/(sheet|sheets|hoja de calculo).*/i
	];

	// Verificar si el mensaje coincide con algún patrón específico
	const matchesPattern = availabilityPatterns.some(pattern =>
		pattern.test(messageLower)
	);

	// Verificar si contiene fechas en formato reconocible
	const datePatterns = [
		/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
		/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/,
	];

	const hasDates = datePatterns.some(pattern => pattern.test(messageLower));

	//return matchesPattern || (hasDates && messageLower.includes('disponib'));
	return matchesPattern || hasDates;

}

// Sistema de puntuación para mayor precisión
function calculateAvailabilityScore(message: string) {
	const messageLower = message.toLowerCase();
	let score = 0;

	// Palabras clave principales (+3 puntos cada una)
	const primaryKeywords = ['disponibilidad', 'reservar', 'reserva'];
	primaryKeywords.forEach(keyword => {
		if (messageLower.includes(keyword)) score += 3;
	});

	// Palabras clave secundarias (+2 puntos cada una)
	const secondaryKeywords = ['disponible', 'libre', 'cabaña', 'habitación'];
	secondaryKeywords.forEach(keyword => {
		if (messageLower.includes(keyword)) score += 2;
	});

	// Palabras de contexto temporal (+1 punto cada una)
	const timeKeywords = ['fecha', 'fechas', 'desde', 'hasta', 'entre', 'personas'];
	timeKeywords.forEach(keyword => {
		if (messageLower.includes(keyword)) score += 1;
	});

	// Patrones de fecha (+4 puntos)
	const datePatterns = [
		/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
		/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/,
	];

	if (datePatterns.some(pattern => pattern.test(message))) {
		score += 4;
	}

	// Palabras clave sync-db (+3 puntos cada una)
	const syncKeywords = ['sync', 'sincronizar', 'sincroniza', 'actualizar', 'actualiza', 'base de datos', 'db', 'bd', 'sheet', 'sheets', 'hoja de calculo'];
	syncKeywords.forEach(keyword => {
		if (messageLower.includes(keyword)) score += 3;
	});


	// Threshold: necesita al menos 5 puntos para activar la tool
	return score >= 5;
}

// Exportar las diferentes versiones para que puedas elegir
export const detectAvailabilityQuery = {
	basic: requiresAvailabilitySearch,
	strict: requiresAvailabilitySearchStrict,
	scored: calculateAvailabilityScore
};


