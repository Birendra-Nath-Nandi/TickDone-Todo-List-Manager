document.addEventListener('DOMContentLoaded', () => {
    // ... (loginForm, signupForm, messageEl declarations are the same)

    const handleFormSubmit = async (form, url) => {
        // ... (button declaration is the same)
        const username = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;
        
        // Add email to the data payload IF it exists in the form
        const emailInput = form.querySelector('#email');
        const email = emailInput ? emailInput.value : null;

        const payload = { username, password, email };

        button.classList.add('loading');
        button.disabled = true;
        messageEl.textContent = '';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                if (form.id === 'signup-form') {
                    messageEl.textContent = 'Success! Please check your email to continue.';
                    messageEl.className = 'success';
                } else {
                    messageEl.textContent = 'Login successful! Redirecting...';
                    messageEl.className = 'success';
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1000);
                }
            } else {
                messageEl.textContent = result.error || 'An unknown error occurred.';
                messageEl.className = 'error';
            }
        } catch (error) {
            messageEl.textContent = 'Could not connect to the server.';
            messageEl.className = 'error';
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };
    
    // ... (loginForm and signupForm event listeners are the same)
});