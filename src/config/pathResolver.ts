import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PROJECT_ROOT = join(__dirname, '../../');

export const paths: Record<string, string> = {
	credentials: join(PROJECT_ROOT, '.credentials'),
	database: join(PROJECT_ROOT, 'database')
};

export function getPath(type: string, ...segments: string[]) {
	const basePath = paths[type] || PROJECT_ROOT;
	return join(basePath, ...segments);
}
