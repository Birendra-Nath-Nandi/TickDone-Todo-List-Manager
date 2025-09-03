document.addEventListener('DOMContentLoaded', () => {
    // --- Form Selections ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const resetForm = document.getElementById('reset-form');
    const messageEl = document.getElementById('form-message');

    // --- Password Toggle Logic ---
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
            } else {
                passwordInput.type = 'password';
            }
        });
    });

    // --- Live Validation Logic ---
    const validateField = (field, regex, message) => {
        const value = field.value;
        // Adjust selector to find the validation message within its group
        const messageContainer = field.closest('.input-group').querySelector('.validation-message');
        if (!messageContainer) return true;

        if (!regex.test(value)) {
            messageContainer.textContent = message;
            return false;
        }
        messageContainer.textContent = '';
        return true;
    };

    if (signupForm) {
        const username = signupForm.querySelector('#username');
        const email = signupForm.querySelector('#email');
        const password = signupForm.querySelector('#password');

        username.addEventListener('input', () => validateField(username, /^[a-zA-Z0-9_-]{3,20}$/, 'Username must be 3-20 valid characters.'));
        email.addEventListener('input', () => validateField(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'));
        password.addEventListener('input', () => validateField(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, 'Min 8 chars, with uppercase, number & symbol.'));
    }

    // --- Form Submission Logic ---
    const setLoading = (form, isLoading) => {
        const button = form.querySelector('.auth-button');
        if (button) {
            button.disabled = isLoading;
            button.classList.toggle('loading', isLoading);
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(loginForm, true);
            const username = loginForm.querySelector('#username').value;
            const password = loginForm.querySelector('#password').value;
            try {
                const response = await fetch('api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const result = await response.json();
                if (response.ok) {
                    messageEl.textContent = 'Login successful! Redirecting...';
                    messageEl.className = 'success';
                    window.location.href = 'app.html';
                } else {
                    messageEl.textContent = result.error; messageEl.className = 'error';
                }
            } catch (error) { messageEl.textContent = 'Server error.'; messageEl.className = 'error'; }
            finally { setLoading(loginForm, false); }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(signupForm, true);
            const username = signupForm.querySelector('#username').value;
            const email = signupForm.querySelector('#email').value;
            const password = signupForm.querySelector('#password').value;
            try {
                const response = await fetch('api/signup.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
                const result = await response.json();
                if (response.ok) {
                    // Redirect to the new verification page on success
                    window.location.href = 'verify_email.html';
                } else {
                    messageEl.textContent = result.error; 
                    messageEl.className = 'error';
                }
            } catch (error) { messageEl.textContent = 'Server error.'; messageEl.className = 'error'; }
            finally { setLoading(signupForm, false); }
        });
    }
    
    if (forgotForm) {
        const emailField = forgotForm.querySelector('#email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        emailField.addEventListener('input', () => {
            validateField(emailField, emailRegex, 'Please enter a valid email address.');
        });

        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateField(emailField, emailRegex, 'Please enter a valid email address.')) {
                return;
            }

            setLoading(forgotForm, true);
            const email = emailField.value;
            try {
                const response = await fetch('api/forgot_password.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                const result = await response.json();
                messageEl.textContent = result.success || result.error;
                messageEl.className = response.ok ? 'success' : 'error';
            } catch (error) { messageEl.textContent = 'Server error.'; messageEl.className = 'error'; }
            finally { setLoading(forgotForm, false); }
        });
    }

    if (resetForm) {
        const passwordField = resetForm.querySelector('#password');
        const confirmPasswordField = resetForm.querySelector('#confirm-password');
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        const passwordMessage = 'Min 8 chars, with uppercase, number & symbol.';

        const validateConfirmPassword = () => {
            const messageContainer = confirmPasswordField.closest('.input-group').querySelector('.validation-message');
            if (passwordField.value !== confirmPasswordField.value) {
                messageContainer.textContent = 'Passwords do not match.';
                return false;
            }
            messageContainer.textContent = '';
            return true;
        };
        
        passwordField.addEventListener('input', () => {
            validateField(passwordField, passwordRegex, passwordMessage);
            if (confirmPasswordField.value) {
                validateConfirmPassword();
            }
        });

        confirmPasswordField.addEventListener('input', validateConfirmPassword);

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const isPasswordValid = validateField(passwordField, passwordRegex, passwordMessage);
            const doPasswordsMatch = validateConfirmPassword();
            
            if (!isPasswordValid || !doPasswordsMatch) {
                return;
            }

            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                messageEl.textContent = 'Invalid or missing reset token.';
                messageEl.className = 'error';
                return;
            }

            setLoading(resetForm, true);
            try {
                const response = await fetch('api/reset_password.php', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ token, password: passwordField.value }) 
                });
                const result = await response.json();
                if (response.ok) {
                    messageEl.textContent = 'Password reset! Redirecting to login...';
                    messageEl.className = 'success';
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    messageEl.textContent = result.error; messageEl.className = 'error';
                }
            } catch (error) { 
                messageEl.textContent = 'Server error.'; 
                messageEl.className = 'error'; 
            } finally { 
                setLoading(resetForm, false); 
            }
        });
    }
});