const express = require('express');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { rateLimiter, helmetConfig } = require('./config/security');
const sequelize = require('./config/database');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(compression());
app.use(helmetConfig);
app.use(rateLimiter);

// Session configuration
app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue!' });
});

// Database sync and server start
sequelize.sync({ alter: true }).then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});