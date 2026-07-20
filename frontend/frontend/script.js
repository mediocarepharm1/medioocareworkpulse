// Replace this with your Render backend URL after deployment
const API_URL = 'https://your-backend-url.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');

    const stored = localStorage.getItem('user');
    if (stored) {
        try {
            const user = JSON.parse(stored);
            if (user && user.id) {
                window.location.href = '/dashboard.html';
                return;
            }
        } catch(e) {}
    }

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

        try {
            const res = await fetch(API_URL + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                message.textContent = '✅ Login successful!';
                message.className = 'success';
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 500);
            } else {
                message.textContent = '❌ ' + data.message;
                message.className = 'error';
            }
        } catch (error) {
            message.textContent = '❌ Network error. Please try again.';
            message.className = 'error';
        }
    });
});
