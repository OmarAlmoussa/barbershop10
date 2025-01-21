// Check authentication on page load
if (!localStorage.getItem('token')) {
    window.location.href = '/admin/login.html';
}

// Improved Navigation with Error Handling
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    if (!navLinks || !sections) {
        console.error('Navigation setup failed: Links or sections missing.');
        return;
    }

    navLinks.forEach(link => {
        if (link.id === 'logout') return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;
            const targetSection = document.getElementById(targetId);

            if (!targetSection) {
                console.error(`Navigation error: Section with ID '${targetId}' not found.`);
                alert('Navigation error: Section not found.');
                return;
            }

            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');

            // Add active class to clicked link and show corresponding section
            link.classList.add('active');
            targetSection.style.display = 'block';
        });
    });
}

// Token Validation Wrapper
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Session expired. Please log in again.');
        window.location.href = '/admin/login.html';
        return;
    }

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            alert('Unauthorized access. Redirecting to login.');
            localStorage.removeItem('token');
            window.location.href = '/admin/login.html';
            return;
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        alert('An error occurred while communicating with the server. Please try again.');
    }
}

// Services Management
async function loadServices() {
    try {
        const response = await fetchWithAuth('/api/services');
        if (!response || !response.ok) throw new Error('Failed to fetch services');

        const services = await response.json();
        const tbody = document.getElementById('services-table-body');
        if (!tbody) {
            console.error('Services table body not found');
            return;
        }

        tbody.innerHTML = '';
        
        services.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>${service.price} NOK</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-service" data-id="${service._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-service" data-id="${service._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update service select in booking forms
        const serviceSelects = document.querySelectorAll('select[name="service"]');
        serviceSelects.forEach(select => {
            select.innerHTML = services.map(service => 
                `<option value="${service._id}">${service.name} - ${service.price} NOK</option>`
            ).join('');
        });
    } catch (error) {
        console.error('Error loading services:', error);
        alert('Error loading services. Please try again.');
    }
}

// Add Service
document.getElementById('add-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetchWithAuth('/api/services', {
            method: 'POST',
            body: JSON.stringify({
                name: formData.get('name'),
                description: formData.get('description'),
                price: Number(formData.get('price'))
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
            e.target.reset();
            loadServices();
        } else {
            throw new Error('Failed to add service');
        }
    } catch (error) {
        console.error('Error adding service:', error);
        alert('Error adding service. Please try again.');
    }
});

// Edit Service
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-service')) {
        const serviceId = e.target.closest('.edit-service').dataset.id;
        try {
            const response = await fetchWithAuth(`/api/services/${serviceId}`);
            const service = await response.json();
            
            const form = document.getElementById('edit-service-form');
            form.serviceId.value = service._id;
            form.name.value = service.name;
            form.description.value = service.description;
            form.price.value = service.price;
            
            new bootstrap.Modal(document.getElementById('editServiceModal')).show();
        } catch (error) {
            console.error('Error loading service details:', error);
            alert('Error loading service details. Please try again.');
        }
    }
});

document.getElementById('edit-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceId = formData.get('serviceId');
    
    try {
        const response = await fetchWithAuth(`/api/services/${serviceId}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: formData.get('name'),
                description: formData.get('description'),
                price: Number(formData.get('price'))
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editServiceModal')).hide();
            loadServices();
        } else {
            throw new Error('Failed to update service');
        }
    } catch (error) {
        console.error('Error updating service:', error);
        alert('Error updating service. Please try again.');
    }
});

// Delete Service
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-service')) {
        if (confirm('Are you sure you want to delete this service?')) {
            const serviceId = e.target.closest('.delete-service').dataset.id;
            try {
                const response = await fetchWithAuth(`/api/services/${serviceId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadServices();
                } else {
                    throw new Error('Failed to delete service');
                }
            } catch (error) {
                console.error('Error deleting service:', error);
                alert('Error deleting service. Please try again.');
            }
        }
    }
});

// Team Management
async function loadTeam() {
    try {
        const response = await fetchWithAuth('/api/team');
        if (!response || !response.ok) throw new Error('Failed to fetch team members');

        const team = await response.json();
        const tbody = document.getElementById('team-table-body');
        if (!tbody) {
            console.error('Team table body not found');
            return;
        }

        tbody.innerHTML = '';
        
        team.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="${member.photo || '/images/default-avatar.png'}" 
                         alt="${member.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">
                </td>
                <td>
                    ${member.name}<br>
                    <small class="text-muted">${member.email}</small>
                </td>
                <td>${member.role}</td>
                <td>${member.bio}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-team" data-id="${member._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-team" data-id="${member._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update barber select in booking forms
        const barberSelects = document.querySelectorAll('select[name="barber"]');
        barberSelects.forEach(select => {
            select.innerHTML = team.map(member => 
                `<option value="${member._id}">${member.name}</option>`
            ).join('');
        });
    } catch (error) {
        console.error('Error loading team:', error);
        alert('Error loading team members. Please try again.');
    }
}

// Add Team Member
document.getElementById('add-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Add Member button clicked');

    try {
        const formData = {
            name: document.getElementById('team-name').value.trim(),
            email: document.getElementById('team-email').value.trim(),
            role: document.getElementById('team-role').value.trim(),
            bio: document.getElementById('team-bio').value.trim(),
            photo: null
        };

        console.log('Form data:', formData);

        // Validate required fields
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.email) missingFields.push('Email');
        if (!formData.role) missingFields.push('Role');
        if (!formData.bio) missingFields.push('Bio');

        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Handle photo upload
        const photoInput = document.getElementById('team-photo');
        if (photoInput.files.length > 0) {
            const file = photoInput.files[0];
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo size must be less than 5MB.');
                return;
            }
            // Convert photo to base64
            try {
                const base64Photo = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                formData.photo = base64Photo;
            } catch (error) {
                console.error('Error converting photo to base64:', error);
                alert('Error processing photo. Please try again.');
                return;
            }
        }

        console.log('Submitting team member data:', { 
            ...formData, 
            photo: formData.photo ? 'base64_data' : null 
        });

        const response = await fetchWithAuth('/api/team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Server error:', errorDetails);
            alert(errorDetails.message || 'Failed to add team member.');
            return;
        }

        const data = await response.json();
        console.log('Server response:', data);

        // Hide modal using Bootstrap
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTeamModal'));
        if (modal) {
            modal.hide();
        }

        // Reset form
        e.target.reset();
        
        // Reload team members
        await loadTeam();
        
        alert('Team member added successfully!');
    } catch (error) {
        console.error('Error in form submission:', error);
        alert('An unexpected error occurred. Please try again.');
    }
});

// Edit Team Member
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-team')) {
        const memberId = e.target.closest('.edit-team').dataset.id;
        try {
            const response = await fetchWithAuth(`/api/team/${memberId}`);
            const member = await response.json();
            
            const form = document.getElementById('edit-team-form');
            form.memberId.value = member._id;
            form.name.value = member.name;
            form.email.value = member.email;
            form.role.value = member.role;
            form.bio.value = member.bio;
            
            new bootstrap.Modal(document.getElementById('editTeamModal')).show();
        } catch (error) {
            console.error('Error loading team member details:', error);
            alert('Error loading team member details. Please try again.');
        }
    }
});

document.getElementById('edit-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = document.getElementById('edit-team-id').value;

    const formData = {
        name: document.getElementById('edit-team-name').value.trim(),
        email: document.getElementById('edit-team-email').value.trim(),
        role: document.getElementById('edit-team-role').value.trim(),
        bio: document.getElementById('edit-team-bio').value.trim(),
        photo: null
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.role || !formData.bio) {
        alert('Please fill in all required fields.');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Handle photo upload
    const photoInput = document.getElementById('edit-team-photo');
    if (photoInput.files.length > 0) {
        const file = photoInput.files[0];
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Photo size must be less than 5MB.');
            return;
        }
        // Convert photo to base64
        try {
            const base64Photo = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            formData.photo = base64Photo;
        } catch (error) {
            console.error('Error converting photo to base64:', error);
            alert('Error processing photo. Please try again.');
            return;
        }
    }

    console.log('Submitting updated team member data:', { 
        ...formData, 
        photo: formData.photo ? 'base64_data' : null 
    });

    try {
        const response = await fetchWithAuth(`/api/team/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Server error:', errorDetails);
            alert(errorDetails.message || 'Failed to update team member.');
            return;
        }

        $('#editTeamModal').modal('hide');
        e.target.reset();
        loadTeam();
        alert('Team member updated successfully!');
    } catch (error) {
        console.error('Error updating team member:', error);
        alert('Error updating team member. Please try again.');
    }
});

// Delete Team Member
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-team')) {
        if (confirm('Are you sure you want to delete this team member?')) {
            const memberId = e.target.closest('.delete-team').dataset.id;
            try {
                const response = await fetchWithAuth(`/api/team/${memberId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadTeam();
                } else {
                    throw new Error('Failed to delete team member');
                }
            } catch (error) {
                console.error('Error deleting team member:', error);
                alert('Error deleting team member. Please try again.');
            }
        }
    }
});

// Bookings Management
async function loadBookings() {
    try {
        const response = await fetchWithAuth('/api/bookings');
        if (!response || !response.ok) throw new Error('Failed to fetch bookings');

        const bookings = await response.json();
        const tbody = document.getElementById('bookings-table-body');
        if (!tbody) {
            console.error('Bookings table body not found');
            return;
        }

        tbody.innerHTML = '';
        
        bookings.forEach(booking => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${booking.customerName}<br>
                    <small>${booking.customerEmail}<br>${booking.customerPhone}</small>
                </td>
                <td>${booking.service.name}</td>
                <td>${booking.barber.name}</td>
                <td>${new Date(booking.date).toLocaleDateString()}</td>
                <td>${booking.time}</td>
                <td>
                    <span class="badge bg-${getStatusBadgeColor(booking.status)}">
                        ${booking.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary edit-booking" data-id="${booking._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-booking" data-id="${booking._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update today's bookings count
        const todayBookings = bookings.filter(booking => 
            new Date(booking.date).toDateString() === new Date().toDateString()
        ).length;
        document.getElementById('today-bookings').textContent = todayBookings;
    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Error loading bookings. Please try again.');
    }
}

function getStatusBadgeColor(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'warning';
        case 'confirmed': return 'primary';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// Add Booking
document.getElementById('add-booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetchWithAuth('/api/bookings', {
            method: 'POST',
            body: JSON.stringify({
                customerName: formData.get('customerName'),
                customerEmail: formData.get('customerEmail'),
                customerPhone: formData.get('customerPhone'),
                service: formData.get('service'),
                barber: formData.get('barber'),
                date: formData.get('date'),
                time: formData.get('time'),
                notes: formData.get('notes'),
                status: 'pending'
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addBookingModal')).hide();
            e.target.reset();
            loadBookings();
        } else {
            throw new Error('Failed to add booking');
        }
    } catch (error) {
        console.error('Error adding booking:', error);
        alert('Error adding booking. Please try again.');
    }
});

// Edit Booking
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-booking')) {
        const bookingId = e.target.closest('.edit-booking').dataset.id;
        try {
            const response = await fetchWithAuth(`/api/bookings/${bookingId}`);
            const booking = await response.json();
            
            const form = document.getElementById('edit-booking-form');
            form.bookingId.value = booking._id;
            form.customerName.value = booking.customerName;
            form.customerEmail.value = booking.customerEmail;
            form.customerPhone.value = booking.customerPhone;
            form.service.value = booking.service._id;
            form.barber.value = booking.barber._id;
            form.date.value = booking.date.split('T')[0];
            form.time.value = booking.time;
            form.status.value = booking.status;
            form.notes.value = booking.notes || '';
            
            new bootstrap.Modal(document.getElementById('editBookingModal')).show();
        } catch (error) {
            console.error('Error loading booking details:', error);
            alert('Error loading booking details. Please try again.');
        }
    }
});

document.getElementById('edit-booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookingId = formData.get('bookingId');
    
    try {
        const response = await fetchWithAuth(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify({
                customerName: formData.get('customerName'),
                customerEmail: formData.get('customerEmail'),
                customerPhone: formData.get('customerPhone'),
                service: formData.get('service'),
                barber: formData.get('barber'),
                date: formData.get('date'),
                time: formData.get('time'),
                status: formData.get('status'),
                notes: formData.get('notes')
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editBookingModal')).hide();
            loadBookings();
        } else {
            throw new Error('Failed to update booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Error updating booking. Please try again.');
    }
});

// Delete Booking
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-booking')) {
        if (confirm('Are you sure you want to delete this booking?')) {
            const bookingId = e.target.closest('.delete-booking').dataset.id;
            try {
                const response = await fetchWithAuth(`/api/bookings/${bookingId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadBookings();
                } else {
                    throw new Error('Failed to delete booking');
                }
            } catch (error) {
                console.error('Error deleting booking:', error);
                alert('Error deleting booking. Please try again.');
            }
        }
    }
});

// Logout setup
function setupLogout() {
    const logoutButton = document.getElementById('logout');
    if (!logoutButton) {
        console.error('Logout button not found.');
        return;
    }

    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        alert('Logged out successfully. Redirecting to login.');
        window.location.href = '/admin/login.html';
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupLogout();
    
    // Show dashboard section by default
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
    }

    // Load initial data
    loadServices();
    loadTeam();
    loadBookings();
});
