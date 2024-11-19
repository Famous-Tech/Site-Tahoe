require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const shopHandler = require('./shop').handler;

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());

// En-têtes HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Bloquer les requêtes curl et wget
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'];
  if (userAgent && (userAgent.includes('curl') || userAgent.includes('Wget') || userAgent.includes('nmap'))) {
    return res.status(403).send('Accès interdit');
  }
  next();
});

// Limite de taux
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Redirection des routes
app.use((req, res, next) => {
  const routes = {
    '/index.html': '/',
    '/faq.html': '/faq',
    '/admin.html': '/admin',
    '/command.html': '/commander',
    '/politique.html': '/Politique-de-confidentialite',
    '/merci.html': '/merci',
    '/services.html' : '/services'
  };

  if (routes[req.url]) {
    res.redirect(301, routes[req.url]);
  } else {
    next();
  }
});

// Routes pour les pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/commander', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'command.html'));
});

app.get('/Politique-de-confidentialite', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'politique.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/merci', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'merci.html'));
});

// Route pour le shop
app.get('/shop', async (req, res) => {
  try {
    const result = await shopHandler({ httpMethod: 'GET', queryStringParameters: req.query });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    next(error);
  }
});

// Utilisation du dossier "public"
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.includes('.env') || path.includes('index.js')) {
      res.status(403).send('Accès interdit');
    }
  }
}));

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`FAMOUS-TECH-GROUP site launched, in local get it at : http://localhost:${port}`);
});

module.exports = app; // Pour les tests