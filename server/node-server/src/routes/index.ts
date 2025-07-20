import { Router } from "express";
import users from "./users";
import organization from "./organizationChart";
import projects from "./projects";
import task from "./tasks";
import invitations from "./invitations";
import members from "./members";
import ideas from "./ideas";
import generate from "./generate"; // new route for Gemini API
import docApi from "./api"; // existing large router with document-management endpoints

const router = Router();

router.use("/users", users);
router.use("/organization", organization);
router.use("/projects", projects);
router.use("/tasks", task);
router.use("/invitations", invitations);
router.use("/members", members);
router.use("/generate", generate); // route for Gemini API
router.use("/ideas", ideas);


// others (document registers, classification, etc.) remain in docApi
router.use(docApi);

export default router;
