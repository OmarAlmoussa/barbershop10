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
            const response = await fetch('/api/services');
            const services = await response.json();
            
            const servicesList = document.getElementById('services-list');
            servicesList.innerHTML = services.map(service => `
                <div class="service">
                    <h3>${service.name}</h3>
                    <p>${service.description || ''}</p>
                    <p>Price: ${service.price} NOK</p>
                    <button onclick="deleteService('${service._id}')" class="delete-btn">Delete</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    // Add service
    window.addService = async () => {
        const name = document.getElementById('service-name').value;
        const description = document.getElementById('service-description').value;
        const price = document.getElementById('service-price').value;

        if (!name || !price) {
            alert('Name and price are required!');
            return;
        }

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    price: Number(price)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add service');
            }

            // Clear form
            document.getElementById('service-name').value = '';
            document.getElementById('service-description').value = '';
            document.getElementById('service-price').value = '';

            // Reload services
            loadServices();
        } catch (error) {
            console.error('Error adding service:', error);
            alert(error.message || 'Failed to add service. Please try again.');
        }
    };

    // Delete service
    window.deleteService = async (serviceId) => {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete service');
            }

            // Reload services
            loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            alert(error.message || 'Failed to delete service. Please try again.');
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
