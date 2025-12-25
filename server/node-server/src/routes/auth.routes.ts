import { Router } from "express";
import { getCurrentUser, login, logout, completeInvitedUserRegistration } from "../controllers/auth";


const router = Router();

router.post("/login", login);

router.post("/complete-registration", completeInvitedUserRegistration);

//router.post("/register", registerUser);

router.get("/me", getCurrentUser);

router.post("/logout", logout);

export default router;
