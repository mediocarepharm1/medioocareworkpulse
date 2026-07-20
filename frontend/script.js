// ============================================
// WORKPULSE – FRONTEND LOGIN LOGIC
// ============================================

// 🔁 IMPORTANT: Replace this URL with your Render backend URL
// Example: 'https://mediocareworkpulse.onrender.com'
const API_URL = 'https://your-backend-url.onrender.com';

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');

    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.id) {
                // Redirect to dashboard
                window.location.href = '/dashboard.html';
                return;
            }
        } catch (e) {
            // If data is corrupted, clear it
            localStorage.removeItem('user');
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get input values
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();

        // Clear previous message
        message.textContent = '';
        message.className = '';

        // Validate input
        if (!phone || !password) {
            message.textContent = '❌ Please fill in all fields';
            message.className = 'error';
            return;
        }

        // Show loading state
        message.textContent = '⏳ Checking credentials...';
        message.className = '';

        try {
            // Send login request to backend
            const response = await fetch(API_URL + '/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (data.success) {
                // Save user data
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success message
                message.textContent = '✅ ' + data.message;
                message.className = 'success';

                // Redirect to dashboard after short delay
                setTimeout(function() {
                    window.location.href = '/dashboard.html';
                }, 500);

            } else {
                // Show error message
                message.textContent = '❌ ' + data.message;
                message.className = 'error';
            }

        } catch (error) {
            console.error('Login error:', error);
            message.textContent = '❌ Network error. Please check your connection.';
            message.className = 'error';
        }
    });

    // For debugging
    console.log('✅ WorkPulse login page loaded');
    console.log('📡 Backend API URL:', API_URL);
});
