document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Logout handler
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/admin/login.html';
    });

    // Load dashboard data
    const loadDashboard = async () => {
        try {
            const response = await fetch('/api/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bookings = await response.json();
            
            // Count today's bookings
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = bookings.filter(booking => 
                booking.date.startsWith(today)
            ).length;
            
            document.getElementById('today-bookings').textContent = todayBookings;
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    // Load services
    const loadServices = async () => {
        try {
            const response = await fetch('/api/services', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const services = await response.json();
            
            const servicesList = document.getElementById('services-list');
            servicesList.innerHTML = services.map(service => `
                <div class="service">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <p>Price: ${service.price} NOK</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    // Load team members
    const loadTeam = async () => {
        try {
            const response = await fetch('/api/team', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const team = await response.json();
            
            const teamList = document.getElementById('team-list');
            teamList.innerHTML = team.map(member => `
                <div class="team-member">
                    <h3>${member.name}</h3>
                    <p>${member.role}</p>
                    <p>${member.bio || ''}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading team:', error);
        }
    };

    // Initial load
    loadDashboard();
    loadServices();
    loadTeam();
});
