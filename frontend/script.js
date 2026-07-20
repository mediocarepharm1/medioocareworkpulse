// ============================================
// WORKPULSE – FRONTEND LOGIN LOGIC
// ============================================

// 🔁 Backend API URL (EXACT URL from Render)
const API_URL = 'https://medioocareworkpulse.onrender.com';

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
                window.location.href = '/dashboard.html';
                return;
            }
        } catch (e) {
            localStorage.removeItem('user');
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();

        message.textContent = '';
        message.className = '';

        if (!phone || !password) {
            message.textContent = '❌ Please fill in all fields';
            message.className = 'error';
            return;
        }

        message.textContent = '⏳ Checking credentials...';
        message.className = '';

        try {
            // ✅ Send request to backend
            const response = await fetch(API_URL + '/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                message.textContent = '✅ ' + data.message;
                message.className = 'success';
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 500);
            } else {
                message.textContent = '❌ ' + data.message;
                message.className = 'error';
            }

        } catch (error) {
            console.error('Login error:', error);
            message.textContent = '❌ Network error. Please check your connection.';
            message.className = 'error';
        }
    });

    console.log('✅ WorkPulse login page loaded');
    console.log('📡 Backend API URL:', API_URL);
});
