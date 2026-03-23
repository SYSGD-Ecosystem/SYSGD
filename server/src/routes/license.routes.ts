import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
  generateLicenseHandler,
  getUserLicensesHandler,
} from "../controllers/license.controller";

const router = Router();

// POST /api/licenses/generate
// Body: { requestCode: string, tier: "monthly" | "quarterly" | "annual" }
// Requiere autenticación: el usuario debe estar logueado en la web
router.post("/generate", isAuthenticated, generateLicenseHandler);

// GET /api/licenses
// Devuelve todas las licencias del usuario autenticado
router.get("/", isAuthenticated, getUserLicensesHandler);

export default router;