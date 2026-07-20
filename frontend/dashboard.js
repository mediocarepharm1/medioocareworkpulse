// ============================================
// WORKPULSE – DASHBOARD (DEMO VERSION)
// ============================================

// ✅ Backend URL – replace with your Render backend URL
const API_URL = 'https://your-backend-url.onrender.com';

// Get user from localStorage
let user = null;
try {
    const stored = localStorage.getItem('user');
    if (stored) user = JSON.parse(stored);
} catch(e) {}

if (!user || !user.id) {
    // If no user, set demo user and reload
    localStorage.setItem('user', JSON.stringify({
        id: 'demo-123',
        name: 'Dr Kennedy',
        role: 'CEO',
        branch_id: 1
    }));
    window.location.reload();
}

// ============================================
// INIT DASHBOARD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    displayUserInfo();
    loadAttendanceHistory();
    checkStatus();
    setupButtons();
});

// ============================================
// DISPLAY USER INFO
// ============================================

function displayUserInfo() {
    document.getElementById('userDisplay').textContent = '👋 ' + user.name;
    document.getElementById('roleDisplay').textContent = 'Role: ' + user.role;
    document.getElementById('branchDisplay').textContent = '📍 Branch: ' + (user.branch_id || 'Not assigned');

    const links = document.getElementById('roleLinks');
    if (user.role === 'CEO') {
        links.innerHTML = '<a href="/ceo.html">📊 CEO Dashboard</a>';
    } else if (user.role === 'manager') {
        links.innerHTML = '<a href="/manager.html">📋 Manager Dashboard</a>';
    } else {
        links.innerHTML = '';
    }
}

// ============================================
// CHECK STATUS
// ============================================

async function checkStatus() {
    try {
        const res = await fetch(`${API_URL}/api/status/${user.id}`);
        const data = await res.json();

        if (data.success && data.status === 'checked_in') {
            document.getElementById('checkStatus').textContent = '✅ Checked In';
            document.getElementById('checkStatus').className = 'status green';
            document.getElementById('checkInBtn').disabled = true;
            document.getElementById('checkOutBtn').disabled = false;
            document.getElementById('hoursDisplay').textContent = data.data.hours_today + 'h';
        } else {
            document.getElementById('checkStatus').textContent = '❌ Not Checked In';
            document.getElementById('checkStatus').className = 'status red';
            document.getElementById('checkInBtn').disabled = false;
            document.getElementById('checkOutBtn').disabled = true;
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

// ============================================
// LOAD ATTENDANCE HISTORY
// ============================================

async function loadAttendanceHistory() {
    try {
        const res = await fetch(`${API_URL}/api/attendance/${user.id}`);
        const data = await res.json();

        const container = document.getElementById('historyContainer');
        const records = data.attendance || [];

        if (records.length === 0) {
            container.innerHTML = '<p style="color:#666;">No attendance records yet.</p>';
            return;
        }

        let html = '<table class="history-table"><thead><tr>';
        html += '<th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead><tbody>';
        records.forEach(r => {
            const date = new Date(r.check_in_time).toLocaleDateString();
            const timeIn = new Date(r.check_in_time).toLocaleTimeString();
            const timeOut = r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-';
            const hours = r.total_hours || 0;
            html += `<tr>
                <td>${date}</td>
                <td>${timeIn}</td>
                <td>${timeOut}</td>
                <td>${hours}h</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyContainer').innerHTML = '<p style="color:#666;">Failed to load history</p>';
    }
}

// ============================================
// CHECK IN
// ============================================

async function checkIn() {
    if (!navigator.geolocation) {
        alert('❌ GPS not supported on this device');
        return;
    }

    navigator.geolocation.getCurrentPosition(async function(position) {
        try {
            const res = await fetch(`${API_URL}/api/attendance/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    branch_id: user.branch_id || 1,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('✅ Checked in successfully at ' + new Date().toLocaleTimeString());
                document.getElementById('checkStatus').textContent = '✅ Checked In';
                document.getElementById('checkStatus').className = 'status green';
                document.getElementById('checkInBtn').disabled = true;
                document.getElementById('checkOutBtn').disabled = false;
                document.getElementById('hoursDisplay').textContent = '0.0h';
                loadAttendanceHistory();
                checkStatus();
            } else {
                alert('❌ ' + data.message);
            }
        } catch (error) {
            alert('❌ Check-in failed. Please try again.');
        }
    }, function(error) {
        alert('❌ Could not get location. Please enable GPS.');
    });
}

// ============================================
// CHECK OUT
// ============================================

async function checkOut() {
    if (!navigator.geolocation) {
        alert('❌ GPS not supported');
        return;
    }

    navigator.geolocation.getCurrentPosition(async function(position) {
        try {
            const res = await fetch(`${API_URL}/api/attendance/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('✅ Checked out at ' + new Date().toLocaleTimeString() + '\nHours: ' + data.hours + 'h');
                document.getElementById('checkStatus').textContent = '❌ Not Checked In';
                document.getElementById('checkStatus').className = 'status red';
                document.getElementById('checkInBtn').disabled = false;
                document.getElementById('checkOutBtn').disabled = true;
                document.getElementById('hoursDisplay').textContent = data.hours + 'h';
                loadAttendanceHistory();
                checkStatus();
            } else {
                alert('❌ ' + data.message);
            }
        } catch (error) {
            alert('❌ Check-out failed. Please try again.');
        }
    }, function(error) {
        alert('❌ Could not get location.');
    });
}

// ============================================
// SETUP BUTTONS
// ============================================

function setupButtons() {
    document.getElementById('checkInBtn').addEventListener('click', checkIn);
    document.getElementById('checkOutBtn').addEventListener('click', checkOut);

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = '/';
    });
}

window.checkIn = checkIn;
window.checkOut = checkOut;
