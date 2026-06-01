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
	logout,
	resendAdminTwoFactor,
	updateTwoFactorStatus,
	verifyAdminTwoFactor,
} from "../controllers/auth";
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

export default router;
