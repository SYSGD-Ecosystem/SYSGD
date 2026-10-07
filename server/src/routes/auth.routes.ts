import { Router } from "express";
import {
	checkUser,
	changePassword,
	completeInvitedUserRegistration,
	deleteOwnAccount,
	getTwoFactorStatus,
	getCurrentUser,
	issueExternalToken,
	login,
	resendAdminTwoFactor,
	updateTwoFactorStatus,
	verifyAdminTwoFactor,
} from "../controllers/auth";
import {
	cerrarOtrasSesiones,
	cerrarSesion,
	listarDispositivos,
	logout,
	refresh,
} from "../controllers/sessions.controller";
import { isAuthenticated } from "../middlewares/auth-jwt";


const router = Router();

router.post("/login", login);
router.post("/verify-2fa", verifyAdminTwoFactor);
router.post("/resend-2fa", resendAdminTwoFactor);
router.post("/check-user", checkUser);

router.post("/complete-registration", completeInvitedUserRegistration);

//router.post("/register", registerUser);

router.get("/me", getCurrentUser);
router.post("/external-token", isAuthenticated, issueExternalToken);
router.get("/2fa/status", isAuthenticated, getTwoFactorStatus);
router.put("/2fa/status", isAuthenticated, updateTwoFactorStatus);
router.put("/password", isAuthenticated, changePassword);
router.delete("/account", isAuthenticated, deleteOwnAccount);

router.post("/logout", logout);

// --- Sesiones ---
// refresh NO lleva isAuthenticated a proposito: el access token puede estar
// expirado, que es justo cuando se necesita renovar.
router.post("/refresh", refresh);

// Estas si requieren access token valido: son acciones del propio usuario.
router.get("/sessions", isAuthenticated, listarDispositivos);
router.delete("/sessions/:id", isAuthenticated, cerrarSesion);
router.post("/sessions/revoke-others", isAuthenticated, cerrarOtrasSesiones);

export default router;
