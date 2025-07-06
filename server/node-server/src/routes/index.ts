import { Router } from "express";
import users from "./users";
import organization from "./organizationChart";
import docApi from "./api"; // existing large router with document-management endpoints

const router = Router();

router.use("/users", users);
router.use("/organization", organization);

// others (document registers, classification, etc.) remain in docApi
router.use(docApi);

export default router;
