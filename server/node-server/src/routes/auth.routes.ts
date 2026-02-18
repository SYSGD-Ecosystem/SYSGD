import { Router } from "express";
import {
	checkUser,
	completeInvitedUserRegistration,
	getCurrentUser,
	issueExternalToken,
	login,
	logout,
} from "../controllers/auth";
import { isAuthenticated } from "../middlewares/auth-jwt";


const router = Router();

router.post("/login", login);
router.post("/check-user", checkUser);

router.post("/complete-registration", completeInvitedUserRegistration);

//router.post("/register", registerUser);

router.get("/me", getCurrentUser);
router.post("/external-token", isAuthenticated, issueExternalToken);

router.post("/logout", logout);

export default router;
