const errorEl = document.getElementById('errorMessage');
const errorTextEl = document.getElementById('errorText');
const submitBtn = document.querySelector('#loginForm button[type="submit"]');

document.getElementById('togglePassword').addEventListener('click', () => {
    const field = document.getElementById('password');
    field.type = field.type === 'password' ? 'text' : 'password';
});

function hideError() {
    errorEl.classList.add('hidden');
    errorEl.classList.remove('fade-in');
}

function showError(message) {
    errorTextEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.classList.add('fade-in');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Map an HTTP failure to a helpful message. 401 gets a friendly fixed
// string; 403 (inactive account) and 429 (login lockout from rate
// limiting) keep the server's message since it is more specific;
// everything else falls back to a generic one.
function failureMessage(status, serverError) {
    if (status === 401) return 'Incorrect email or password. Please try again.';
    if ((status === 403 || status === 429) && serverError) return serverError;
    return 'Login failed. Please try again.';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    hideError();
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    let succeeded = false;
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
            // Keep the button disabled - the page is about to navigate away.
            succeeded = true;
            submitBtn.textContent = 'Success! Redirecting...';
            window.location.href = data.redirect;
        } else {
            showError(failureMessage(response.status, data.error));
        }
    } catch (err) {
        console.error(err);
        showError('Unable to connect to the server.');
    } finally {
        if (!succeeded) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    }
});
