import type { Request } from 'express';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
				username: string;
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
// 			username: string;
// 			name: string;
// 			privileges: string;
// 		};
// 	}
// }