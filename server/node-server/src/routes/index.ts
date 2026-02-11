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
import qwen from "./qwen"; // new route for Gemini API
import openrouterai from "./openrouterai.routes";
import openrouter from "./openrouter"; // new route for OpenRouter Agent
import docApi from "./api"; // existing large router with document-management endpoints
import chat  from "./chat";
import agents from "./agents";
import upload from "./upload";
import github from "./github.routes";
import taskConfig from "./task-config";
import tokenRoutes from "./tokens";
import cryptoPaymentRoutes from "./cryptoPayments.routes";
import veri from "./verification.routes";
import updates from "./updates.routes";
import timeEntries from "./time-entries";

const router = Router();

router.use("/users", users);
router.use("/organization", organization);
router.use("/projects", projects);
router.use("/tasks", task);
router.use("/invitations", invitations);
router.use("/members", members);
router.use("/generate", generate);
router.use("/qwen", qwen);
router.use("/openrouterai", openrouterai);
router.use("/openrouter", openrouter);
router.use("/ideas", ideas);
router.use("/", notes); // notas tienen rutas mixtas (/projects/:id/notes y /notes/:id)
router.use("/auth", authRoutes);
router.use("/chat", chat);
router.use("/agents", agents);
router.use("/uploads", upload);
router.use("/upload", upload);
router.use("/github", github);
router.use('/tokens', tokenRoutes);
router.use('/crypto-payments', cryptoPaymentRoutes);
router.use("/verification", veri);
router.use("/", taskConfig);
router.use("/time-entries", timeEntries);

router.use(updates);


// others (document registers, classification, etc.) remain in docApi
router.use(docApi);

export default router;
