// TickDone-Todo-List-Manager/TickDone/assets/js/profile-view.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const firstNameEl = document.getElementById('first-name'); // Changed from fullNameEl
    const lastNameEl = document.getElementById('last-name');   // New element
    const ageEl = document.getElementById('age');
    const joiningDateEl = document.getElementById('joining-date');

    // --- API Fetch Function ---
    async function fetchProfileData() {
        try {
            const response = await fetch('api/get_profile.php');

            if (!response.ok) {
                if (response.status === 401) window.location.href = 'login.html';
                throw new Error('Failed to fetch profile data.');
            }

            const data = await response.json();
            updateProfileUI(data);

        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    // --- UI Update Function ---
    function updateProfileUI(data) {
        usernameEl.textContent = data.username || 'N/A';
        emailEl.textContent = data.email || 'N/A';
        firstNameEl.textContent = data.first_name || 'Not Set'; // Updated
        lastNameEl.textContent = data.last_name || 'Not Set';   // Updated
        ageEl.textContent = data.age || 'Not Set';
        joiningDateEl.textContent = data.joining_date || 'N/A';
    }

    // --- Initial Load ---
    fetchProfileData();
});