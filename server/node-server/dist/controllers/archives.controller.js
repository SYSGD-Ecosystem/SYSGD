"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchives = void 0;
const db_1 = require("../db");
const getArchives = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("la funcion de ontener archivos se esta ejecutando");
    const user = req.user;
    console.log(user);
    if (!user || !user.id || !user.username || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    const user_id = user.id;
    const privileges = user.privileges;
    try {
        const baseQuery = `
        SELECT
          d.id,
          d.code,
          d.company,
          d.name,
          d.created_at,
          u.name AS creator_name
        FROM document_management_file d
        JOIN users u ON d.user_id = u.id
      `;
        const result = privileges === "admin"
            ? yield db_1.pool.query(baseQuery)
            : yield db_1.pool.query(`${baseQuery} WHERE d.user_id = $1`, [user_id]);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error al obtener archivos:", err);
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});
exports.getArchives = getArchives;
