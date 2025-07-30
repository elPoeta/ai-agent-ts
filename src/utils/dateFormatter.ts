export const parseCsvDateString = (dateString: string): Date => {
	const [day, month, year] = dateString.split("/").map(Number);
	return new Date(year, month - 1, day);
}

export const getDateISO = (dateObject: Date): string => dateObject.toISOString().split("T")[0];


export function parseDateToISO(dateStr: string) {
	if (!dateStr) return null;

	// Limpiar espacios y normalizar separadores
	const cleanDate = dateStr.trim().replace(/\//g, '-');

	// Patrones de fecha con sus regex correspondientes
	const patterns = [
		// YYYY-MM-DD (ya está en formato correcto)
		{
			regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
			format: (match: any) => {
				const [, year, month, day] = match;
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
		},
		// YYYY/MM/DD
		{
			regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
			format: (match: any) => {
				const [, year, month, day] = match;
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
		},
		// DD-MM-YYYY o DD-MM-YY
		{
			regex: /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
			format: (match: any) => {
				const [, day, month, year] = match;
				let fullYear = year;

				// Si el año tiene 2 dígitos, asumimos 20XX
				if (year.length === 2) {
					fullYear = `20${year}`;
				}

				return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
		},
		// DD/MM/YYYY o DD/MM/YY
		{
			regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
			format: (match: any) => {
				const [, day, month, year] = match;
				let fullYear = year;

				// Si el año tiene 2 dígitos, asumimos 20XX  
				if (year.length === 2) {
					fullYear = `20${year}`;
				}

				return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
		}
	];

	// Intentar cada patrón
	for (const pattern of patterns) {
		const match = cleanDate.match(pattern.regex);
		if (match) {
			const formattedDate = pattern.format(match);
			// Validar que la fecha sea válida
			const dateObj = new Date(formattedDate);
			if (!isNaN(dateObj.getTime())) {
				return formattedDate;
			}
		}
	}

	return null; // No se pudo parsear
}

