import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middlewares/auth-jwt';
import {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  sendMessageToAgent
} from '../controllers/agents.controller';

const router = Router();

// CRUD de agentes
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  await createAgent(req, res);
});
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  await getAgents(req, res);
});
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  await getAgentById(req, res);
});
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  await updateAgent(req, res);
});
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  await deleteAgent(req, res);
});

// Enviar mensaje a agente
router.post('/message', isAuthenticated, async (req: Request, res: Response) => {
  await sendMessageToAgent(req, res);
});

export default router;
