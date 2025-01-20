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
                serviceForm.reset();
                loadServices();
            } else {
                throw new Error('Failed to add service');
            }
        } catch (error) {
            console.error('Error adding service:', error);
            alert('Failed to add service. Please try again.');
        }
    });
}

// Other functions for loading and managing services, team members, and bookings can go here.
