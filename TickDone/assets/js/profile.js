document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;

    const messageEl = document.getElementById('form-message');
    const firstNameField = profileForm.querySelector('#first-name');
    const lastNameField = profileForm.querySelector('#last-name');
    const dobField = profileForm.querySelector('#dob');

    // --- Live Input Validation Logic ---
    const validateName = (field) => {
        const value = field.value;
        const messageContainer = field.parentElement.querySelector('.validation-message');
        
        // Last name is optional, so it's valid if empty
        if (field.id === 'last-name' && value.trim() === '') {
            messageContainer.textContent = '';
            return true;
        }

        if (!/^[a-zA-Z-' ]*$/.test(value)) {
            messageContainer.textContent = 'Names can only contain letters and spaces.';
            return false;
        }
        
        messageContainer.textContent = '';
        return true;
    };

    const validateDob = () => {
        const value = dobField.value;
        const messageContainer = dobField.parentElement.querySelector('.validation-message');
        if (!value) { // The 'required' attribute handles empty cases on submit
            messageContainer.textContent = '';
            return true;
        }

        const dob = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - dob.getFullYear();
        
        if (dob > now || age < 5 || age > 120) {
            messageContainer.textContent = 'Please enter a valid date of birth.';
            return false;
        }

        messageContainer.textContent = '';
        return true;
    };
    
    // Attach live validation listeners
    firstNameField.addEventListener('input', () => validateName(firstNameField));
    lastNameField.addEventListener('input', () => validateName(lastNameField));
    dobField.addEventListener('input', validateDob);


    // --- Form Submission Logic ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Re-validate all fields before submitting
        const isFirstNameValid = validateName(firstNameField);
        const isLastNameValid = validateName(lastNameField);
        const isDobValid = validateDob();

        if (!isFirstNameValid || !isLastNameValid || !isDobValid) {
            messageEl.textContent = 'Please fix the errors before submitting.';
            messageEl.className = 'error';
            return;
        }

        const button = profileForm.querySelector('.auth-button');
        setLoading(true);

        try {
            const response = await fetch('api/complete_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstNameField.value,
                    lastName: lastNameField.value,
                    dob: dobField.value
                })
            });

            const result = await response.json();

            if (response.ok) {
                messageEl.textContent = 'Profile complete! Redirecting to your dashboard...';
                messageEl.className = 'success';
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
            setLoading(false);
        }

        function setLoading(isLoading) {
            if (button) {
                button.disabled = isLoading;
                button.classList.toggle('loading', isLoading);
            }
        }
    });
});