// Check if user is already logged in
const token = localStorage.getItem('token');
if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = '/admin/login.html';
}

// DOM Elements
const addServiceBtn = document.getElementById('add-service-btn');
const addTeamBtn = document.getElementById('add-team-btn');
const serviceModal = document.getElementById('service-modal');
const teamModal = document.getElementById('team-modal');
const serviceForm = document.getElementById('service-form');
const teamForm = document.getElementById('team-form');
const logoutButton = document.getElementById('logout');
const servicesList = document.getElementById('services-list');
const teamList = document.getElementById('team-list');
const bookingsList = document.getElementById('bookings-list');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadServices();
    loadTeamMembers();
    loadBookings();
    setupLogout();
});

// Navigation Setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'logout') return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked link and corresponding section
            link.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            // Load section data if needed
            if (targetId === 'services') {
                loadServices();
            } else if (targetId === 'team') {
                loadTeamMembers();
            } else if (targetId === 'bookings') {
                loadBookings();
            }
        });
    });
}

// Load Services
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        
        servicesList.innerHTML = services.map(service => `
            <div class="card">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <p class="price">${service.price.toFixed(2)} NOK</p>
                <button onclick="deleteService('${service._id}')" class="delete-btn">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load Team Members
async function loadTeamMembers() {
    try {
        const response = await fetch('/api/team');
        const team = await response.json();
        
        teamList.innerHTML = team.map(member => `
            <div class="card">
                ${member.photo ? `<img src="${member.photo}" alt="${member.name}" class="team-photo">` : ''}
                <h3>${member.name}</h3>
                <p><strong>${member.role}</strong></p>
                <p>${member.bio || ''}</p>
                <button onclick="deleteTeamMember('${member._id}')" class="delete-btn">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

// Load bookings
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings');
        const bookings = await response.json();
        bookingsList.innerHTML = '';

        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            bookingCard.innerHTML = `
                <div class="header">
                    <h3>Booking #${booking._id.slice(-6)}</h3>
                    <span class="status ${booking.status.toLowerCase()}">${booking.status}</span>
                </div>
                <div class="customer-info">
                    <p><strong>Customer:</strong> ${booking.customerName}</p>
                    <p><strong>Email:</strong> ${booking.customerEmail}</p>
                    <p><strong>Phone:</strong> ${booking.customerPhone}</p>
                </div>
                <div class="service-info">
                    <p><strong>Service:</strong> ${booking.service.name} (${booking.service.price} NOK)</p>
                    <p><strong>Barber:</strong> ${booking.barber.name}</p>
                    <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${booking.time}</p>
                    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                </div>
                <div class="actions">
                    ${booking.status === 'PENDING' ? `
                        <button class="action-btn confirm-btn" onclick="updateBookingStatus('${booking._id}', 'CONFIRMED')">Confirm</button>
                        <button class="action-btn cancel-btn" onclick="updateBookingStatus('${booking._id}', 'CANCELLED')">Cancel</button>
                    ` : booking.status === 'CONFIRMED' ? `
                        <button class="action-btn complete-btn" onclick="updateBookingStatus('${booking._id}', 'COMPLETED')">Mark as Completed</button>
                        <button class="action-btn cancel-btn" onclick="updateBookingStatus('${booking._id}', 'CANCELLED')">Cancel</button>
                    ` : ''}
                </div>
            `;
            bookingsList.appendChild(bookingCard);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Error loading bookings', 'error');
    }
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification('Booking status updated successfully', 'success');
            loadBookings();
        } else {
            throw new Error('Failed to update booking status');
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        showNotification('Error updating booking status', 'error');
    }
}

// Event Listeners
if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
        serviceModal.style.display = 'block';
        serviceForm.reset();
    });
}

if (addTeamBtn) {
    addTeamBtn.addEventListener('click', () => {
        teamModal.style.display = 'block';
        teamForm.reset();
    });
}

// Close modals when clicking outside or on close button
window.addEventListener('click', (e) => {
    if (e.target === serviceModal) {
        serviceModal.style.display = 'none';
    }
    if (e.target === teamModal) {
        teamModal.style.display = 'none';
    }
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        serviceModal.style.display = 'none';
        teamModal.style.display = 'none';
    });
});

// Handle service form submission
if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-description').value,
            price: parseFloat(document.getElementById('service-price').value)
        };

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                serviceModal.style.display = 'none';
                loadServices();
                serviceForm.reset();
            } else {
                console.error('Error adding service');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

// Handle team form submission
if (teamForm) {
    teamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('team-name').value,
            role: document.getElementById('team-role').value,
            bio: document.getElementById('team-bio').value,
            photo: document.getElementById('team-photo').value
        };

        try {
            const response = await fetch('/api/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                teamModal.style.display = 'none';
                loadTeamMembers();
                teamForm.reset();
            } else {
                console.error('Error adding team member');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

// Delete Service
async function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        try {
            const response = await fetch(`/api/services/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                loadServices();
            } else {
                console.error('Error deleting service');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Delete Team Member
async function deleteTeamMember(id) {
    if (confirm('Are you sure you want to delete this team member?')) {
        try {
            const response = await fetch(`/api/team/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                loadTeamMembers();
            } else {
                console.error('Error deleting team member');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Setup Logout
function setupLogout() {
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/admin/login.html';
        });
    }
}
