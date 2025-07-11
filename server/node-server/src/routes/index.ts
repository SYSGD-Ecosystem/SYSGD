import { Router } from "express";
import users from "./users";
import organization from "./organizationChart";
import projects from "./projects";
import task from "./tasks";
import invitations from "./invitations";
import docApi from "./api"; // existing large router with document-management endpoints

const router = Router();

router.use("/users", users);
router.use("/organization", organization);
router.use("/projects", projects);
router.use("/tasks", task);
router.use("/invitations", invitations);

// others (document registers, classification, etc.) remain in docApi
router.use(docApi);

export default router;
