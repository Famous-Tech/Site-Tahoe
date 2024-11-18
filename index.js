// index.js
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "cdnjs.cloudflare.com", "cdn.tailwindcss.com"],
            "style-src": ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        },
    },
}));

// Configuration de base
app.use(compression()); // Compression gzip
app.use(morgan('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuration EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// Configuration de la session
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Flash messages
app.use(flash());

// Middleware global pour les variables de vue
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.messages = req.flash();
    res.locals.cart = req.session.cart || [];
    res.locals.cartTotal = res.locals.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    next();
});

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Le fichier doit être une image'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Validation middleware
const validators = {
    register: [
        body('email')
            .isEmail()
            .withMessage('Email invalide')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit contenir au moins 8 caractères')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
            .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
        body('nom')
            .trim()
            .notEmpty()
            .withMessage('Le nom est requis')
            .isLength({ min: 2 })
            .withMessage('Le nom doit contenir au moins 2 caractères'),
        body('prenom')
            .trim()
            .notEmpty()
            .withMessage('Le prénom est requis')
            .isLength({ min: 2 })
            .withMessage('Le prénom doit contenir au moins 2 caractères')
    ],
    product: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Le nom du produit est requis')
            .isLength({ min: 3 })
            .withMessage('Le nom du produit doit contenir au moins 3 caractères'),
        body('price')
            .isFloat({ min: 0 })
            .withMessage('Le prix doit être un nombre positif'),
        body('stock')
            .isInt({ min: 0 })
            .withMessage('Le stock doit être un nombre entier positif'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('La description est requise')
            .isLength({ min: 10 })
            .withMessage('La description doit contenir au moins 10 caractères')
    ]
};

// Middleware d'authentification admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Accès non autorisé');
        res.redirect('/auth/login');
    }
};

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Application des routes avec leurs middlewares
app.use('/auth', authRoutes(validators.register));
app.use('/admin', isAdmin, adminRoutes(validators.product, upload));
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes);
app.use('/profile', profileRoutes);

// Route principale
app.get('/', async (req, res) => {
    try {
        const { rows: featuredProducts } = await pool.query(
            'SELECT * FROM products WHERE featured = true LIMIT 6'
        );
        res.render('home', {
            title: 'Accueil',
            featuredProducts
        });
    } catch (err) {
        req.flash('error', 'Erreur lors du chargement de la page');
        res.render('home', {
            title: 'Accueil',
            featuredProducts: []
        });
    }
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
        req.flash('error', 'Erreur lors du téléchargement du fichier');
        return res.redirect('back');
    }

    if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        return res.redirect('back');
    }

    req.flash('error', 'Une erreur est survenue');
    res.status(500).render('error', {
        title: 'Erreur',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// donk la depi yon moun ale nan on paj ki pa egziste lap bay sa 
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page non trouvée'
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    if (process.env.NODE_ENV === 'development') {
        console.log(`http://localhost:${PORT}`);
    }
});

module.exports = app;
