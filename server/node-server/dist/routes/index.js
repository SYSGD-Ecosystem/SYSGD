"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const organizationChart_1 = __importDefault(require("./organizationChart"));
const projects_routes_1 = __importDefault(require("./projects.routes"));
const tasks_1 = __importDefault(require("./tasks"));
const invitations_1 = __importDefault(require("./invitations"));
const members_1 = __importDefault(require("./members"));
const ideas_1 = __importDefault(require("./ideas"));
const notes_1 = __importDefault(require("./notes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const generate_1 = __importDefault(require("./generate")); // new route for Gemini API
const api_1 = __importDefault(require("./api")); // existing large router with document-management endpoints
const chat_1 = require("./chat");
const router = (0, express_1.Router)();
router.use("/users", users_1.default);
router.use("/organization", organizationChart_1.default);
router.use("/projects", projects_routes_1.default);
router.use("/tasks", tasks_1.default);
router.use("/invitations", invitations_1.default);
router.use("/members", members_1.default);
router.use("/generate", generate_1.default); // route for Gemini API
router.use("/ideas", ideas_1.default);
router.use("/", notes_1.default); // notas tienen rutas mixtas (/projects/:id/notes y /notes/:id)
router.use("/auth", auth_routes_1.default);
router.use("/chat", chat_1.chatRouter);
// others (document registers, classification, etc.) remain in docApi
router.use(api_1.default);
exports.default = router;
