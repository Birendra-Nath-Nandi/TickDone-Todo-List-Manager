document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageEl = document.getElementById('form-message');

    const handleFormSubmit = async (form, url) => {
        const button = form.querySelector('.auth-button');
        const username = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;

        // Start loading state
        button.classList.add('loading');
        button.disabled = true;
        messageEl.textContent = '';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                messageEl.textContent = (form.id === 'login-form')
                    ? 'Login successful! Redirecting...'
                    : 'Signup successful! Please log in.';
                messageEl.className = 'success';
                
                const redirectUrl = (form.id === 'login-form') ? 'app.html' : 'login.html';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000); // Short delay to show success message
            } else {
                messageEl.textContent = result.error || 'An unknown error occurred.';
                messageEl.className = 'error';
            }
        } catch (error) {
            messageEl.textContent = 'Could not connect to the server.';
            messageEl.className = 'error';
        } finally {
            // End loading state, regardless of success or failure
            button.classList.remove('loading');
            button.disabled = false;
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(loginForm, 'api/login.php');
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(signupForm, 'api/signup.php');
        });
    }
});