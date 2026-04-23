import { Router } from 'express';
import { createRequest, getRequests, updateStatus } from '../controllers/requestController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', createRequest);
router.get('/', getRequests);
router.put('/:id/status', requireAuth, updateStatus);

export default router;