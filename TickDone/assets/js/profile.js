document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const messageEl = document.getElementById('form-message');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const button = profileForm.querySelector('.auth-button');
            const firstName = profileForm.querySelector('#first-name').value;
            const lastName = profileForm.querySelector('#last-name').value;
            const dob = profileForm.querySelector('#dob').value;

            // Start loading state
            button.classList.add('loading');
            button.disabled = true;
            messageEl.textContent = '';

            try {
                const response = await fetch('api/complete_profile.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, dob })
                });

                const result = await response.json();

                if (response.ok) {
                    messageEl.textContent = 'Profile complete! Redirecting to your dashboard...';
                    messageEl.className = 'success';
                    // Redirect to the main app on success
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1500);
                } else {
                    messageEl.textContent = result.error || 'An unknown error occurred.';
                    messageEl.className = 'error';
                }

            } catch (error) {
                messageEl.textContent = 'Could not connect to the server.';
                messageEl.className = 'error';
            } finally {
                // End loading state
                button.classList.remove('loading');
                button.disabled = false;
            }
        });
    }
});