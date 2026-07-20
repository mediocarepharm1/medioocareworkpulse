// ============================================
// WORKPULSE – BACKEND (DEMO VERSION)
// No login required – returns a default user
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS – allow all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

app.use(express.json());

// ============================================
// SUPABASE CLIENT
// ============================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ============================================
// ROUTES
// ============================================

// ✅ Test route
app.get('/', (req, res) => {
    res.json({ message: 'WorkPulse API is running!' });
});

// ✅ DEMO: Get default user (no login required)
app.get('/api/demo-user', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 'demo-123',
            name: 'Dr Kennedy',
            role: 'CEO',
            branch_id: 1
        }
    });
});

// ✅ DEMO: Login accepts any credentials and returns default user
app.post('/api/login', (req, res) => {
    res.json({
        success: true,
        message: 'Login successful (demo)',
        user: {
            id: 'demo-123',
            name: 'Dr Kennedy',
            role: 'CEO',
            branch_id: 1
        }
    });
});

// ============================================
// ATTENDANCE API
// ============================================
app.post('/api/attendance/checkin', async (req, res) => {
    try {
        const { user_id, branch_id, lat, lng } = req.body;

        const { data, error } = await supabase
            .from('attendance')
            .insert([{
                user_id: user_id || 'demo-123',
                branch_id: branch_id || 1,
                check_in_time: new Date().toISOString(),
                check_in_lat: lat || 0,
                check_in_lng: lng || 0,
                status: 'active'
            }])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ success: false, message: 'Check-in failed' });
        }

        res.json({ success: true, message: 'Checked in successfully', data: data[0] });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ success: false, message: 'Check-in failed' });
    }
});

app.post('/api/attendance/checkout', async (req, res) => {
    try {
        const { user_id, lat, lng } = req.body;

        // Find active check-in
        const { data: active, error: findError } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user_id || 'demo-123')
            .eq('status', 'active')
            .order('check_in_time', { ascending: false })
            .limit(1);

        if (findError) {
            console.error('Find error:', findError);
            return res.status(500).json({ success: false, message: 'Check-out failed' });
        }

        if (!active || active.length === 0) {
            return res.status(400).json({ success: false, message: 'Not checked in' });
        }

        const record = active[0];
        const checkInTime = new Date(record.check_in_time);
        const now = new Date();
        const hours = (now - checkInTime) / (1000 * 60 * 60);

        const { data, error: updateError } = await supabase
            .from('attendance')
            .update({
                check_out_time: now.toISOString(),
                check_out_lat: lat || 0,
                check_out_lng: lng || 0,
                total_hours: Math.round(hours * 100) / 100,
                status: 'completed'
            })
            .eq('id', record.id)
            .select();

        if (updateError) {
            console.error('Update error:', updateError);
            return res.status(500).json({ success: false, message: 'Check-out failed' });
        }

        res.json({
            success: true,
            message: 'Checked out successfully',
            hours: Math.round(hours * 100) / 100,
            data: data[0]
        });
    } catch (err) {
        console.error('Check-out error:', err);
        res.status(500).json({ success: false, message: 'Check-out failed' });
    }
});

app.get('/api/attendance/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user_id)
            .order('check_in_time', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Fetch error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
        }

        res.json({ success: true, attendance: data || [] });
    } catch (err) {
        console.error('Attendance error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
});

app.get('/api/status/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user_id)
            .eq('status', 'active')
            .order('check_in_time', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Status error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch status' });
        }

        if (data && data.length > 0) {
            const record = data[0];
            const checkInTime = new Date(record.check_in_time);
            const now = new Date();
            const hours = (now - checkInTime) / (1000 * 60 * 60);
            res.json({
                success: true,
                status: 'checked_in',
                data: {
                    ...record,
                    hours_today: Math.round(hours * 100) / 100
                }
            });
        } else {
            res.json({ success: true, status: 'checked_out' });
        }
    } catch (err) {
        console.error('Status error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
});

// ============================================
// EMPLOYEE / BRANCH APIS
// ============================================
app.get('/api/branches', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .order('name');

        if (error) {
            console.error('Branches error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch branches' });
        }

        res.json({ success: true, branches: data || [] });
    } catch (err) {
        console.error('Branches error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch branches' });
    }
});

app.get('/api/branch/:branch_id/employees', async (req, res) => {
    try {
        const { branch_id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('branch_id', parseInt(branch_id))
            .order('first_name');

        if (error) {
            console.error('Employees error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch employees' });
        }

        // Get active status for each employee
        const employees = data || [];
        const result = [];

        for (const emp of employees) {
            const { data: attData } = await supabase
                .from('attendance')
                .select('id, check_in_time, status')
                .eq('user_id', emp.id)
                .eq('status', 'active')
                .limit(1);

            result.push({
                ...emp,
                attendance_status: attData && attData.length > 0 ? 'active' : null,
                check_in_time: attData && attData.length > 0 ? attData[0].check_in_time : null
            });
        }

        res.json({ success: true, employees: result });
    } catch (err) {
        console.error('Employees error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch employees' });
    }
});

app.get('/api/ranking', async (req, res) => {
    try {
        // Get branches
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .select('*');

        if (branchError) {
            console.error('Ranking error:', branchError);
            return res.status(500).json({ success: false, message: 'Failed to fetch ranking' });
        }

        const ranking = [];

        for (const branch of branches || []) {
            // Get total hours for this branch
            const { data: hoursData } = await supabase
                .from('attendance')
                .select('total_hours')
                .eq('branch_id', branch.id)
                .eq('status', 'completed');

            const totalHours = (hoursData || []).reduce((sum, h) => sum + (h.total_hours || 0), 0);

            ranking.push({
                id: branch.id,
                name: branch.name,
                total_hours: totalHours,
                attendance_count: (hoursData || []).length
            });
        }

        ranking.sort((a, b) => b.total_hours - a.total_hours);

        res.json({ success: true, ranking });
    } catch (err) {
        console.error('Ranking error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch ranking' });
    }
});

// ============================================
// ADMIN APIs
// ============================================
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('first_name');

        if (error) {
            console.error('Admin users error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }

        res.json({ success: true, users: data || [] });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { phone, password_hash, first_name, last_name, role, branch_id } = req.body;

        if (!phone || !first_name || !last_name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('users')
            .insert([{
                phone_number: phone,
                password_hash: password_hash || '123456',
                first_name,
                last_name,
                role: role || 'staff',
                branch_id: branch_id || null
            }])
            .select();

        if (error) {
            console.error('Create user error:', error);
            return res.status(500).json({ success: false, message: 'Failed to create user' });
        }

        res.json({ success: true, user: data[0] });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({ success: false, message: 'Failed to delete user' });
        }

        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

app.post('/api/admin/branches', async (req, res) => {
    try {
        const { name, location, latitude, longitude } = req.body;

        if (!name || !location) {
            return res.status(400).json({ success: false, message: 'Name and location required' });
        }

        const { data, error } = await supabase
            .from('branches')
            .insert([{
                name,
                location,
                latitude: parseFloat(latitude) || 0,
                longitude: parseFloat(longitude) || 0
            }])
            .select();

        if (error) {
            console.error('Create branch error:', error);
            return res.status(500).json({ success: false, message: 'Failed to create branch' });
        }

        res.json({ success: true, branch: data[0] });
    } catch (err) {
        console.error('Create branch error:', err);
        res.status(500).json({ success: false, message: 'Failed to create branch' });
    }
});

app.delete('/api/admin/branches/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('branches')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Delete branch error:', error);
            return res.status(500).json({ success: false, message: 'Failed to delete branch' });
        }

        res.json({ success: true, message: 'Branch deleted' });
    } catch (err) {
        console.error('Delete branch error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete branch' });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 WorkPulse API running on port ${PORT}`);
});
