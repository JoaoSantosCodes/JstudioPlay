const axios = require('axios');

async function checkApiShapes() {
    const base = 'http://localhost:3000';
    console.log('--- Checking API Responses against Frontend expectations ---');

    const session = await axios.get(`${base}/api/session`);
    console.log('Session user:', session.data.user);
    console.log('Session favorites sample:', session.data.favorites[0]);
    console.log('Session history sample:', session.data.history[0]);
    console.log('Session progress sample:', session.data.progress[0]);

    const users = await axios.get(`${base}/api/admin/users`);
    console.log('Admin users sample:', users.data[0]);

    const logs = await axios.get(`${base}/api/admin/logs`);
    console.log('Admin logs sample:', logs.data[0]);
}

checkApiShapes();
