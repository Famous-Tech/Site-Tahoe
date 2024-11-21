const { Client } = require('pg');
const bcrypt = require('bcrypt');
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

    const { email, password } = JSON.parse(event.body);

    // Vérifier si l'utilisateur existe
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);
    const user = userResult.rows[0];

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Identifiants invalides' }),
      };
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Identifiants invalides' }),
      };
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Créer un cookie
    const cookieOptions = {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
      secure: process.env.NODE_ENV === 'production',
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connexion réussie', token }),
      headers: {
        'Set-Cookie': `token=${token}; ${cookieOptions}`,
      },
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la connexion' }),
    };
  } finally {
    await client.end();
  }
};