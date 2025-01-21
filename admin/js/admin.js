document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Initialize navigation
    initializeNavigation();
    
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load initial data
    loadDashboard();
    loadUsers();
    loadEmployees();
    loadServices();
    loadBookings();
    loadGallery();
    loadContactInfo();
    loadSettings();
});

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.id === 'logout') {
                handleLogout();
                return;
            }
            
            // Remove active class from all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all nav links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Add active class to clicked link and corresponding section
            link.classList.add('active');
            const sectionId = link.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Clock
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
}

// Dashboard
async function loadDashboard() {
    try {
        // Load today's bookings
        const bookingsResponse = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const bookings = await bookingsResponse.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(booking => 
            booking.date.startsWith(today)
        );
        
        document.getElementById('today-bookings').textContent = todayBookings.length;
        
        // Load active employees
        const employeesResponse = await fetch('/api/team', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const employees = await employeesResponse.json();
        const activeEmployees = employees.filter(emp => emp.available);
        
        document.getElementById('active-employees').textContent = activeEmployees.length;
        
        // Load upcoming bookings
        const upcoming = bookings.filter(booking => 
            new Date(booking.date) > new Date()
        );
        
        document.getElementById('upcoming-bookings').textContent = upcoming.length;
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Users Management
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = users.map(user => `
            <div class="card">
                <h3>${user.username}</h3>
                <p>Role: ${user.role}</p>
                <p>Last Login: ${new Date(user.lastLogin).toLocaleString()}</p>
                <div class="card-actions">
                    <button onclick="editUser('${user._id}')">Edit</button>
                    <button onclick="deleteUser('${user._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Employee Management
async function loadEmployees() {
    try {
        const response = await fetch('/api/team', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const employees = await response.json();
        
        const employeesList = document.getElementById('employees-list');
        employeesList.innerHTML = employees.map(employee => `
            <div class="card">
                <div class="employee-info">
                    <h3>${employee.name}</h3>
                    <p>Role: ${employee.role}</p>
                    <p>Status: ${employee.available ? 'Available' : 'Not Available'}</p>
                </div>
                <div class="card-actions">
                    <button onclick="editEmployee('${employee._id}')">Edit</button>
                    <button onclick="deleteEmployee('${employee._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Services Management
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        
        const servicesList = document.getElementById('services-list');
        servicesList.innerHTML = services.map(service => `
            <div class="card">
                <h3>${service.name}</h3>
                <p>${service.description || ''}</p>
                <p>Price: ${service.price} NOK</p>
                <div class="card-actions">
                    <button onclick="editService('${service._id}')">Edit</button>
                    <button onclick="deleteService('${service._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Bookings Management
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const bookings = await response.json();
        
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="card">
                <h3>Booking #${booking._id}</h3>
                <p>Date: ${new Date(booking.date).toLocaleDateString()}</p>
                <p>Time: ${booking.time}</p>
                <p>Service: ${booking.service}</p>
                <p>Customer: ${booking.customerName}</p>
                <div class="card-actions">
                    <button onclick="editBooking('${booking._id}')">Edit</button>
                    <button onclick="deleteBooking('${booking._id}')" class="delete-btn">Cancel</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Gallery Management
async function loadGallery() {
    try {
        const response = await fetch('/api/gallery', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const images = await response.json();
        
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = images.map(image => `
            <div class="gallery-item">
                <img src="${image.url}" alt="${image.title}">
                <div class="gallery-item-actions">
                    <button onclick="deleteImage('${image._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Contact Info Management
async function loadContactInfo() {
    try {
        const response = await fetch('/api/contact', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const contactInfo = await response.json();
        
        // Populate form fields
        document.getElementById('sandnes-address').value = contactInfo.sandnes.address;
        document.getElementById('sandnes-phone').value = contactInfo.sandnes.phone;
        document.getElementById('klepp-address').value = contactInfo.klepp.address;
        document.getElementById('klepp-phone').value = contactInfo.klepp.phone;
        document.getElementById('instagram-url').value = contactInfo.social.instagram;
        document.getElementById('facebook-url').value = contactInfo.social.facebook;
    } catch (error) {
        console.error('Error loading contact info:', error);
    }
}

// Settings Management
async function loadSettings() {
    try {
        const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const settings = await response.json();
        
        document.getElementById('language-preference').value = settings.language;
        document.getElementById('email-notifications').checked = settings.emailNotifications;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Service Management Functions
async function addService() {
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
}

async function deleteService(serviceId) {
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

        loadServices();
    } catch (error) {
        console.error('Error deleting service:', error);
        alert(error.message || 'Failed to delete service. Please try again.');
    }
}

// Backup and Restore Functions
async function backupData() {
    try {
        const responses = await Promise.all([
            fetch('/api/services', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/team', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/gallery', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/contact', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/settings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        
        const [services, team, bookings, gallery, contact, settings] = await Promise.all(
            responses.map(r => r.json())
        );
        
        const backup = {
            services,
            team,
            bookings,
            gallery,
            contact,
            settings,
            timestamp: new Date().toISOString()
        };
        
        // Create and download backup file
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barbershop_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Log activity
        const activity = new Activity({
            description: 'Database backup created',
            timestamp: new Date()
        });
        await activity.save();
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Failed to create backup. Please try again.');
    }
}

async function restoreData() {
    try {
        const fileInput = document.getElementById('restore-file');
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a backup file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                // Validate backup structure
                const required = ['services', 'team', 'bookings', 'gallery', 'contact', 'settings'];
                if (!required.every(key => key in backup)) {
                    throw new Error('Invalid backup file structure');
                }
                
                // Restore data
                await Promise.all([
                    fetch('/api/restore/services', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.services)
                    }),
                    fetch('/api/restore/team', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.team)
                    }),
                    fetch('/api/restore/bookings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.bookings)
                    }),
                    fetch('/api/restore/gallery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.gallery)
                    }),
                    fetch('/api/restore/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.contact)
                    }),
                    fetch('/api/restore/settings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(backup.settings)
                    })
                ]);
                
                // Log activity
                const activity = new Activity({
                    description: 'Database restored from backup',
                    timestamp: new Date()
                });
                await activity.save();
                
                alert('Data restored successfully');
                window.location.reload();
            } catch (error) {
                console.error('Error restoring data:', error);
                alert('Failed to restore data. Please ensure the backup file is valid.');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error restoring data:', error);
        alert('Failed to restore data. Please try again.');
    }
}

// Utility Functions
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
}

async function loadRecentActivity() {
    try {
        const response = await fetch('/api/activity', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const activities = await response.json();
        
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</span>
                <span class="activity-text">${activity.description}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Modal Functions
function showAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'block';
}

function showAddEmployeeModal() {
    document.getElementById('add-employee-modal').style.display = 'block';
}

function showRestoreModal() {
    document.getElementById('restore-modal').style.display = 'block';
}

// Close all modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Map initialization
function initMaps() {
    // Sandnes Map
    const sandnesMap = new google.maps.Map(document.getElementById('sandnes-map'), {
        zoom: 15,
        center: { lat: 58.8517, lng: 5.7347 } // Sandnes coordinates
    });
    
    // Klepp Map
    const kleppMap = new google.maps.Map(document.getElementById('klepp-map'), {
        zoom: 15,
        center: { lat: 58.7889, lng: 5.6345 } // Klepp coordinates
    });
    
    // Add markers when addresses are updated
    document.getElementById('sandnes-address').addEventListener('change', function() {
        updateMapMarker(this.value, sandnesMap, 'Sandnes Branch');
    });
    
    document.getElementById('klepp-address').addEventListener('change', function() {
        updateMapMarker(this.value, kleppMap, 'Klepp Branch');
    });
}

function updateMapMarker(address, map, title) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK') {
            map.setCenter(results[0].geometry.location);
            new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                title: title
            });
        }
    });
}
