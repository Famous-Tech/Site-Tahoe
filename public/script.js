document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
  
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
  
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
  
          const data = await response.json();
  
          if (response.ok) {
            // Stocker le token dans un cookie
            document.cookie = `token=${data.token}; max-age=${30 * 24 * 60 * 60}; path=/`;
            window.location.href = '/shop';
          } else {
            alert(data.message);
          }
        } catch (error) {
          console.error('Erreur lors de la connexion:', error);
        }
      });
    }
  });