const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const securityConfig = {
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  }),
  
  helmetConfig: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
};

module.exports = securityConfig;
