import type {} from './types/express';
import express from 'express';
import path from 'path';
import { sessionConfig } from './config/session';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Remont API',
      version: '1.0.0',
      description: 'REST API для веб-приложения Remont',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Подключаем Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/openapi.json', (req, res) => res.json(swaggerSpec));

const projectRoot = path.resolve(__dirname, '../..');
const clientDir = path.join(projectRoot, 'client');
const pagesDir = path.join(clientDir, 'pages');
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig);

app.use('/api', authRoutes);
app.use('/api/requests', requestRoutes);

const pageRoutes = ['about', 'team', 'works', 'review', 'contacts', 'admin'];

app.get('/', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

for (const page of pageRoutes) {
  app.get(`/${page}.html`, (req, res) => {
    if (page === 'admin' && !req.session.userId) {
      return res.status(403).send('Access denied. <a href="/">Home</a>');
    }

    res.sendFile(path.join(pagesDir, `${page}.html`));
  });
}

app.use(express.static(clientDir, { dotfiles: 'ignore' }));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Sessions: 24 hours');
});
