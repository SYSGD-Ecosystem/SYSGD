"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const project_controller_1 = require("../controllers/project.controller");
const router = (0, express_1.Router)();
// Crear nuevo proyecto
router.post("/", auth_jwt_1.isAuthenticated, project_controller_1.createProject);
// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
router.get("/", auth_jwt_1.isAuthenticated, project_controller_1.getProjects);
// Obtener proyecto individual
router.get("/:id", auth_jwt_1.isAuthenticated, project_controller_1.getProjectById);
exports.default = router;
