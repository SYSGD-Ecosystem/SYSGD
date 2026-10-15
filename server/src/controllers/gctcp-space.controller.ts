import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import {
  createGctcpSpace,
  deleteGctcpSpace,
  getGctcpSpace,
  listGctcpSpaces,
  updateGctcpSpace,
} from "../services/gctcp-space.service";

export const listGctcpSpacesHandler = async (req: Request, res: Response) => {
  const user = getCurrentUserData(req);
  if (!user?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  try {
    const rows = await listGctcpSpaces(user.id);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error listando gctcp spaces:", error);
    res.status(500).json({ error: "Error listando spaces" });
  }
};

export const getGctcpSpaceHandler = async (req: Request, res: Response) => {
  const user = getCurrentUserData(req);
  if (!user?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  try {
    const space = await getGctcpSpace(user.id, String(req.params.spaceId));
    if (!space) {
      res.status(404).json({ error: "Space no encontrado" });
      return;
    }
    res.status(200).json(space);
  } catch (error) {
    console.error("Error obteniendo gctcp space:", error);
    res.status(500).json({ error: "Error obteniendo space" });
  }
};

export const updateGctcpSpaceHandler = async (req: Request, res: Response) => {
  const user = getCurrentUserData(req);
  if (!user?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  const body = req.body as { data?: unknown };
  if (typeof body.data === "undefined") {
    res.status(400).json({ error: "Falta el campo data" });
    return;
  }
  try {
    const result = await updateGctcpSpace(user.id, String(req.params.spaceId), body.data);
    res.status(200).json({ message: "Space actualizado", updatedAt: result.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error actualizando space";
    const status = message === "Space no encontrado" ? 404 : 500;
    res.status(status).json({ error: message });
  }
};

export const createGctcpSpaceHandler = async (req: Request, res: Response) => {
  const user = getCurrentUserData(req);
  if (!user?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  const body = req.body as { spaceId?: string; data?: unknown };
  if (typeof body.data === "undefined" || typeof body.spaceId !== "string") {
    res.status(400).json({ error: "Faltan campos: spaceId y data" });
    return;
  }
  try {
    const result = await createGctcpSpace(user.id, body.spaceId, body.data);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creando gctcp space:", error);
    res.status(500).json({ error: "Error creando space" });
  }
};

export const deleteGctcpSpaceHandler = async (req: Request, res: Response) => {
  const user = getCurrentUserData(req);
  if (!user?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  try {
    await deleteGctcpSpace(user.id, String(req.params.spaceId));
    res.status(200).json({ message: "Space eliminado" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error eliminando space";
    const status = message === "Space no encontrado" ? 404 : 500;
    res.status(status).json({ error: message });
  }
};
