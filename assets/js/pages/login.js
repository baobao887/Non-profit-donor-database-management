document.getElementById('togglePassword').addEventListener('click', () => {
    const field = document.getElementById('password');
    field.type = field.type === 'password' ? 'text' : 'password';
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('login-handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.location.href = data.redirect;
        } else {
            alert(data.error || 'Login failed.');
        }

    } catch (err) {
        console.error(err);
        alert('Unable to connect to the server.');
    }
});
