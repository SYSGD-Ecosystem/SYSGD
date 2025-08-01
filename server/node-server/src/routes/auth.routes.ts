import { Router } from "express";
import { getCurrentUser, login, logout } from "../controllers/auth";


const router = Router();

router.post("/login", login);

//router.post("/register", registerUser);

router.get("/me", getCurrentUser);

router.post("/logout", logout);

export default router;
