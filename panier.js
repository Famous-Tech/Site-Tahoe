const { Client } = require('pg');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const { token } = event.cookies;

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Non autorisé' }),
      };
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer les produits dans le panier de l'utilisateur
    const query = 'SELECT p.* FROM products p INNER JOIN cart c ON p.id = c.product_id WHERE c.user_id = $1';
    const result = await client.query(query, [decoded.userId]);
    const products = result.rows;

    // Générer le HTML pour le panier
    const panierHTML = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TAHOE - Panier</title>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }

              :root {
                  --primary: #FF3366;
                  --secondary: #2A2A2A;
                  --accent: #FFD700;
              }

              body {
                  font-family: 'Poppins', sans-serif;
                  background: #000;
                  color: #fff;
                  overflow-x: hidden;
              }

              .navbar {
                  position: fixed;
                  width: 100%;
                  padding: 1.5rem 3rem;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  z-index: 100;
                  background: rgba(0,0,0,0.8);
                  backdrop-filter: blur(10px);
              }

              .logo {
                  font-family: 'Playfair Display', serif;
                  font-size: 2.5rem;
                  color: var(--primary);
                  text-decoration: none;
              }

              .nav-links {
                  display: flex;
                  gap: 2rem;
              }

              .nav-links a {
                  color: #fff;
                  text-decoration: none;
                  font-weight: 300;
                  transition: color 0.3s;
              }

              .nav-links a:hover {
                  color: var(--primary);
              }

              .cart {
                  padding: 5rem 10%;
              }

              .cart-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 2rem;
                  margin-top: 3rem;
              }

              .cart-card {
                  background: rgba(255,255,255,0.05);
                  border-radius: 15px;
                  padding: 1.5rem;
                  transition: transform 0.3s;
                  cursor: pointer;
              }

              .cart-card:hover {
                  transform: translateY(-10px);
              }

              .cart-image {
                  width: 100%;
                  height: 300px;
                  background: #2A2A2A;
                  border-radius: 10px;
                  margin-bottom: 1rem;
              }

              @media (max-width: 768px) {
                  .navbar {
                      padding: 1rem;
                  }

                  .nav-links {
                      display: none;
                  }
              }
          </style>
      </head>
      <body>
          <nav class="navbar">
              <a href="/" class="logo">TAHOE</a>
              <div class="nav-links">
                  <a href="/shop">Boutique</a>
                  <a href="/about">À propos</a>
                  <a href="/contact">Contact</a>
              </div>
          </nav>

          <section class="cart">
              <h2>Votre Panier</h2>
              <div class="cart-grid">
                  ${products.map(product => `
                      <div class="cart-card">
                          <div class="cart-image">
                              <img src="/api/placeholder/300/300" alt="${product.name}" />
                          </div>
                          <h3>${product.name}</h3>
                          <p>${product.price} USD</p>
                          <button onclick="removeFromCart(${product.id})">Retirer du panier</button>
                      </div>
                  `).join('')}
              </div>
              <button onclick="checkout()">Payer</button>
          </section>

          <script>
              function removeFromCart(productId) {
                  // Retirer le produit du panier
                  console.log('Produit retiré du panier:', productId);
              }

              function checkout() {
                  // Gérer le paiement
                  console.log('Paiement en cours...');
              }
          </script>
      </body>
      </html>
    `;

    return {
      statusCode: 200,
      body: panierHTML,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    return {
      statusCode: 500,
      body: 'Erreur lors de la récupération du panier',
    };
  } finally {
    await client.end();
  }
};