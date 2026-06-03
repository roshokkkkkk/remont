import { Router } from 'express';
import { login, getSession, logout } from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Неверные учетные данные
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Иван"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации
 */
// router.post('/register', register); // Раскомментируйте, если есть контроллер register

/**
 * @swagger
 * /auth/session:
 *   get:
 *     summary: Получить текущую сессию
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Данные сессии
 *       401:
 *         description: Не авторизован
 */
router.get('/session', getSession);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выйти из системы
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успешный выход
 */
router.post('/logout', logout);

export default router;