import { Router } from "express";
import { login } from "../controllers/auth";


const router = Router();

router.post("/login", login);
//router.post("/register", registerUser);


router.post("/logout", (req, res) => {
	req.session.destroy(() => res.json({ message: "Sesión cerrada" }));
});

export default router;
