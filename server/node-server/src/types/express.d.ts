import type { Request } from 'express';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				email: string;
				name: string;
				privileges: string;
			};
		}
	}
}

// Ejemplo para crear types
// declare module "express-session" {
// 	interface SessionData {
// 		user?: {
// 			id: number;
// 			email: string;
// 			name: string;
// 			privileges: string;
// 		};
// 	}
// }