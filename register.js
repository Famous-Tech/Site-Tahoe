const { Client } = require('pg');
const bcrypt = require('bcrypt');

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

    // Vérifier si l'utilisateur existe déjà
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);

    if (userResult.rows.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Cet email est déjà utilisé' }),
      };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur dans la base de données
    const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id';
    const insertResult = await client.query(insertQuery, [email, hashedPassword]);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Inscription réussie', userId: insertResult.rows[0].id }),
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de l\'inscription' }),
    };
  } finally {
    await client.end();
  }
};