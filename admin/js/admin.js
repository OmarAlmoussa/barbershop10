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

    // Initialize calendar
    initializeCalendar();

    // Initialize charts
    initializeCharts();

    // Initialize business hours
    initializeBusinessHours();

    // Initialize gallery
    initializeGallery();
    loadReviews();
    loadActivityLog();

    // Initialize new components
    initializeAnalytics();
    initializeMarketingTools();
    loadInventory();
    initializeSchedule();
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
function initializeGallery() {
    loadGallery();
    
    const galleryModal = new bootstrap.Modal(document.getElementById('galleryModal'));
    const uploadForm = document.getElementById('gallery-upload-form');
    const photoInput = document.getElementById('gallery-photos');
    const previewContainer = document.getElementById('preview-container');
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');

    document.getElementById('add-gallery-btn').addEventListener('click', () => {
        previewContainer.innerHTML = '';
        uploadForm.reset();
        galleryModal.show();
    });

    photoInput.addEventListener('change', function() {
        previewContainer.innerHTML = '';
        [...this.files].forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'col-4';
                preview.innerHTML = `
                    <div class="position-relative">
                        <img src="${e.target.result}" class="img-fluid rounded" alt="Preview">
                        <button type="button" class="btn-close position-absolute top-0 end-0 m-1" 
                                aria-label="Remove"></button>
                    </div>
                `;
                preview.querySelector('.btn-close').addEventListener('click', () => {
                    preview.remove();
                });
                previewContainer.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    });

    document.getElementById('upload-gallery').addEventListener('click', async function() {
        const files = photoInput.files;
        if (files.length === 0) return;

        const formData = new FormData();
        [...files].forEach(file => {
            formData.append('photos', file);
        });

        progress.style.display = 'block';
        progressBar.style.width = '0%';

        try {
            const response = await fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showAlert('Photos uploaded successfully', 'success');
                galleryModal.hide();
                loadGallery();
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            showAlert('Error uploading photos', 'danger');
        } finally {
            progress.style.display = 'none';
        }
    });
}

async function loadGallery() {
    try {
        const response = await fetch('/api/gallery');
        const photos = await response.json();
        
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = photos.map(photo => `
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="card h-100">
                    <img src="${photo.url}" class="card-img-top" alt="${photo.title || 'Gallery Image'}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePhoto('${photo._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                            <small class="text-muted">${new Date(photo.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery:', error);
        showAlert('Error loading gallery', 'danger');
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
        const response = await fetch(`/api/gallery/${photoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Photo deleted successfully', 'success');
            loadGallery();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        showAlert('Error deleting photo', 'danger');
    }
}

// Customer Reviews Management
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        document.getElementById('reviews-list').innerHTML = reviews.map(review => `
            <tr>
                <td>${review.customerName}</td>
                <td>
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                </td>
                <td>${review.text}</td>
                <td>${new Date(review.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="badge bg-${review.approved ? 'success' : 'warning'}">
                        ${review.approved ? 'Approved' : 'Pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-${review.approved ? 'warning' : 'success'}" 
                            onclick="toggleReviewStatus('${review._id}', ${!review.approved})">
                        ${review.approved ? 'Unpublish' : 'Publish'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview('${review._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        showAlert('Error loading reviews', 'danger');
    }
}

async function toggleReviewStatus(reviewId, approved) {
    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ approved })
        });

        if (response.ok) {
            showAlert('Review status updated', 'success');
            loadReviews();
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        console.error('Error updating review:', error);
        showAlert('Error updating review', 'danger');
    }
}

// Activity Log
async function loadActivityLog() {
    try {
        const response = await fetch('/api/activity-log');
        const activities = await response.json();
        
        document.getElementById('activity-log').innerHTML = activities.map(activity => `
            <tr>
                <td>${new Date(activity.timestamp).toLocaleString()}</td>
                <td>${activity.user}</td>
                <td>${activity.action}</td>
                <td>${activity.details}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading activity log:', error);
        showAlert('Error loading activity log', 'danger');
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

// Calendar Management
function initializeCalendar() {
    const calendar = document.getElementById('bookings-calendar');
    let currentDate = new Date();

    function updateCalendar() {
        fetch(`/api/bookings/week/${currentDate.toISOString()}`)
            .then(response => response.json())
            .then(bookings => {
                renderCalendarView(calendar, currentDate, bookings);
            })
            .catch(error => {
                console.error('Error loading calendar:', error);
                showAlert('Error loading calendar', 'danger');
            });
    }

    document.getElementById('prev-week').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        updateCalendar();
    });

    document.getElementById('next-week').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        updateCalendar();
    });

    updateCalendar();
}

// Analytics Charts
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenue-chart').getContext('2d');
    fetch('/api/analytics/revenue')
        .then(response => response.json())
        .then(data => {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue (NOK)',
                        data: data.values,
                        borderColor: '#2c3e50',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        });

    // Services Chart
    const servicesCtx = document.getElementById('services-chart').getContext('2d');
    fetch('/api/analytics/services')
        .then(response => response.json())
        .then(data => {
            new Chart(servicesCtx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#2c3e50',
                            '#34495e',
                            '#7f8c8d',
                            '#95a5a6',
                            '#bdc3c7'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        });
}

// Business Hours Management
function initializeBusinessHours() {
    const container = document.getElementById('business-hours-container');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
        container.innerHTML += `
            <div class="mb-3">
                <label class="form-label">${day}</label>
                <div class="d-flex gap-2">
                    <input type="time" class="form-control" id="${day.toLowerCase()}-open" style="width: 120px">
                    <span class="align-self-center">to</span>
                    <input type="time" class="form-control" id="${day.toLowerCase()}-close" style="width: 120px">
                    <div class="form-check align-self-center ms-2">
                        <input class="form-check-input" type="checkbox" id="${day.toLowerCase()}-closed">
                        <label class="form-check-label">Closed</label>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('business-hours-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const hours = {};
        days.forEach(day => {
            const dayLower = day.toLowerCase();
            hours[dayLower] = {
                closed: document.getElementById(`${dayLower}-closed`).checked,
                open: document.getElementById(`${dayLower}-open`).value,
                close: document.getElementById(`${dayLower}-close`).value
            };
        });

        fetch('/api/settings/hours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hours)
        })
        .then(response => response.json())
        .then(() => {
            showAlert('Business hours updated successfully', 'success');
        })
        .catch(error => {
            console.error('Error updating business hours:', error);
            showAlert('Error updating business hours', 'danger');
        });
    });
}

// Export Functionality
document.getElementById('export-bookings').addEventListener('click', function() {
    fetch('/api/bookings/export')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            console.error('Error exporting bookings:', error);
            showAlert('Error exporting bookings', 'danger');
        });
});

// Advanced Analytics
function initializeAnalytics() {
    // Revenue Trends Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#4CAF50',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });

    // Time Slot Chart
    const timeSlotCtx = document.getElementById('timeSlotChart').getContext('2d');
    const timeSlotChart = new Chart(timeSlotCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Bookings',
                data: [],
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });

    // Service Performance Chart
    const serviceCtx = document.getElementById('serviceChart').getContext('2d');
    const serviceChart = new Chart(serviceCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });

    // Demographics Chart
    const demographicsCtx = document.getElementById('demographicsChart').getContext('2d');
    const demographicsChart = new Chart(demographicsCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });

    // Load Analytics Data
    loadAnalyticsData('week');

    // Time Range Buttons
    document.querySelectorAll('[data-range]').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('[data-range]').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadAnalyticsData(e.target.dataset.range);
        });
    });
}

async function loadAnalyticsData(timeRange) {
    try {
        const response = await fetch(`/api/analytics?range=${timeRange}`);
        const data = await response.json();

        // Update Charts
        updateRevenueChart(data.revenue);
        updateTimeSlotChart(data.timeSlots);
        updateServiceChart(data.services);
        updateDemographicsChart(data.demographics);

        // Update Metrics
        document.getElementById('retentionRate').textContent = data.metrics.retentionRate + '%';
        document.getElementById('avgBookingValue').textContent = '$' + data.metrics.avgBookingValue;
        document.getElementById('newCustomers').textContent = data.metrics.newCustomers;
        document.getElementById('satisfactionRate').textContent = data.metrics.satisfactionRate + '%';
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAlert('Error loading analytics data', 'danger');
    }
}

// Marketing Tools
function initializeMarketingTools() {
    const emailForm = document.getElementById('emailCampaignForm');
    const smsForm = document.getElementById('smsCampaignForm');
    const smsTextarea = smsForm.querySelector('textarea');
    const smsChars = document.getElementById('smsChars');

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(emailForm);
            const response = await fetch('/api/marketing/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showAlert('Email campaign created successfully', 'success');
                emailForm.reset();
            } else {
                throw new Error('Failed to create email campaign');
            }
        } catch (error) {
            console.error('Error creating email campaign:', error);
            showAlert('Error creating email campaign', 'danger');
        }
    });

    smsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(smsForm);
            const response = await fetch('/api/marketing/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showAlert('SMS campaign sent successfully', 'success');
                smsForm.reset();
            } else {
                throw new Error('Failed to send SMS campaign');
            }
        } catch (error) {
            console.error('Error sending SMS campaign:', error);
            showAlert('Error sending SMS campaign', 'danger');
        }
    });

    smsTextarea.addEventListener('input', () => {
        const remaining = 160 - smsTextarea.value.length;
        smsChars.textContent = remaining;
    });
}

// Inventory Management
async function loadInventory() {
    try {
        const response = await fetch('/api/inventory');
        const products = await response.json();
        
        document.getElementById('inventoryList').innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>
                    <span class="badge bg-${product.stock > 10 ? 'success' : 'warning'}">
                        ${product.stock}
                    </span>
                </td>
                <td>$${product.price}</td>
                <td>
                    <span class="badge bg-${product.status === 'active' ? 'success' : 'secondary'}">
                        ${product.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${product._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory:', error);
        showAlert('Error loading inventory', 'danger');
    }
}

// Staff Schedule
function initializeSchedule() {
    const calendar = new FullCalendar.Calendar(document.getElementById('scheduleCalendar'), {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        slotMinTime: '09:00:00',
        slotMaxTime: '21:00:00',
        allDaySlot: false,
        slotDuration: '00:30:00',
        events: '/api/schedule',
        editable: true,
        eventClick: function(info) {
            editShift(info.event);
        },
        eventDrop: function(info) {
            updateShift(info.event);
        },
        eventResize: function(info) {
            updateShift(info.event);
        }
    });

    calendar.render();
}
