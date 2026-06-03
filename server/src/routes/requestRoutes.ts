import { Router } from 'express';
import { createRequest, getRequests, updateStatus } from '../controllers/requestController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Создать новую заявку
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Ремонт крыши"
 *               description:
 *                 type: string
 *                 example: "Нужно починить крышу"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: "high"
 *     responses:
 *       201:
 *         description: Заявка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "pending"
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
router.post('/', createRequest);

/**
 * @swagger
 * /requests:
 *   get:
 *     summary: Получить все заявки
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список всех заявок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Не авторизован
 */
router.get('/', requireAuth, getRequests);

/**
 * @swagger
 * /requests/{id}/status:
 *   put:
 *     summary: Обновить статус заявки
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *                 example: "in_progress"
 *     responses:
 *       200:
 *         description: Статус успешно обновлен
 *       404:
 *         description: Заявка не найдена
 *       401:
 *         description: Не авторизован
 */
router.put('/:id/status', requireAuth, updateStatus);

export default router;