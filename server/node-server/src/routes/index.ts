import { Router } from "express";
import users from "./users";
import organization from "./organizationChart";
import projects from "./projects.routes";
import task from "./tasks";
import invitations from "./invitations";
import members from "./members";
import ideas from "./ideas";
import notes from "./notes";
import authRoutes from "./auth.routes";
import generate from "./generate"; // new route for Gemini API
import docApi from "./api"; // existing large router with document-management endpoints
import chat  from "./chat";
import agents from "./agents";
import upload from "./upload";

const router = Router();

router.use("/users", users);
router.use("/organization", organization);
router.use("/projects", projects);
router.use("/tasks", task);
router.use("/invitations", invitations);
router.use("/members", members);
router.use("/generate", generate); // route for Gemini API
router.use("/ideas", ideas);
router.use("/", notes); // notas tienen rutas mixtas (/projects/:id/notes y /notes/:id)
router.use("/auth", authRoutes);
router.use("/chat", chat);
router.use("/agents", agents);
router.use("/uploads", upload);


// others (document registers, classification, etc.) remain in docApi
router.use(docApi);

export default router;
