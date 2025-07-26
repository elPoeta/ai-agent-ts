export const parseCsvDateString = (dateString: string): Date => {
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day);
}

export const getDateISO = (dateObject: Date): string => dateObject.toISOString().split("T")[0];

