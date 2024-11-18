const express = require('express');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const flash = require('connect-flash');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Initialisation de l'application Express
const app = express();

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  user: '',
  host: '',
  database: '',
  password: '',
  port: 5432,
});

// Middlewares
app.use(morgan('dev')); // Logging des requêtes HTTP
app.use(bodyParser.urlencoded({ extended: false })); // Parsing des requêtes URL-encoded
app.use(bodyParser.json()); // Parsing des requêtes JSON
app.use(cookieParser()); // Parsing des cookies
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: false })); // Gestion des sessions
app.use(flash()); // Gestion des messages flash
app.use(helmet()); // Sécurité HTTP

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Configuration du rate limiter pour prévenir les attaques DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Routes API
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Routes statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route par défaut
app.get('/', (req, res) => {
  res.send('Bienvenue sur le site e-commerce de Tahoe!');
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});