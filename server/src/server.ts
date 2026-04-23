import './types/express.d.ts';
import express from 'express';
import path from 'path';
import { sessionConfig } from './config/session';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';

const app = express();
const pagesDir = path.join(__dirname, '../pages');
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig);

// API маршруты
app.use('/api/login', authRoutes);
app.use('/api/requests', requestRoutes);

// Страницы
const pageRoutes = ['about', 'team', 'works', 'review', 'contacts', 'admin'];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

for (const page of pageRoutes) {
  app.get(`/${page}.html`, (req, res) => {
    if (page === 'admin' && !req.session.userId) {
      return res.status(403).send('Доступ запрещён. <a href="/">На главную</a>');
    }
    res.sendFile(path.join(pagesDir, `${page}.html`));
  });
}

app.use(express.static(path.join(__dirname, '..'), { dotfiles: 'ignore' }));

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`⏱ Sessions: 24 hours`);
});