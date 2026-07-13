document.getElementById('togglePassword').addEventListener('click', () => { const field = document.getElementById('password'); field.type = field.type === 'password' ? 'text' : 'password'; });
document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); location.href = 'index.html'; });
