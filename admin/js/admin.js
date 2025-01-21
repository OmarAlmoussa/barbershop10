// Check if user is logged in
if (!localStorage.getItem('token')) {
    window.location.href = '/admin/login';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Hide all sections except dashboard initially
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'dashboard-section') {
            section.style.display = 'none';
        }
    });

    // Add click handlers for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.id !== 'logout') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.dataset.section;
                
                if (sectionId) {
                    // Hide all sections
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    
                    // Show selected section
                    const selectedSection = document.getElementById(sectionId);
                    if (selectedSection) {
                        selectedSection.style.display = 'block';
                    }
                    
                    // Update active state in navigation
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    this.classList.add('active');
                }
            });
        }
    });

    // Load initial data
    loadServices();
    loadTeam();
    loadBookings();
});

// Logout handler
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
});

// Services Management
async function loadServices() {
    try {
        const response = await fetch('/api/services', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const services = await response.json();
        const tbody = document.getElementById('services-table-body');
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
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
            const response = await fetch(`/api/services/${serviceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
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
        const response = await fetch(`/api/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
                const response = await fetch(`/api/services/${serviceId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
        const response = await fetch('/api/team', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const team = await response.json();
        const tbody = document.getElementById('team-table-body');
        tbody.innerHTML = '';
        
        team.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="${member.image || '/images/default-avatar.png'}" 
                         alt="${member.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">
                </td>
                <td>${member.name}</td>
                <td>${member.role}</td>
                <td>${member.description}</td>
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
    const formData = new FormData(e.target);
    try {
        const response = await fetch('/api/team', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addTeamModal')).hide();
            e.target.reset();
            loadTeam();
        } else {
            throw new Error('Failed to add team member');
        }
    } catch (error) {
        console.error('Error adding team member:', error);
        alert('Error adding team member. Please try again.');
    }
});

// Edit Team Member
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-team')) {
        const memberId = e.target.closest('.edit-team').dataset.id;
        try {
            const response = await fetch(`/api/team/${memberId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const member = await response.json();
            
            const form = document.getElementById('edit-team-form');
            form.memberId.value = member._id;
            form.name.value = member.name;
            form.role.value = member.role;
            form.description.value = member.description;
            
            new bootstrap.Modal(document.getElementById('editTeamModal')).show();
        } catch (error) {
            console.error('Error loading team member details:', error);
            alert('Error loading team member details. Please try again.');
        }
    }
});

document.getElementById('edit-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const memberId = formData.get('memberId');
    
    try {
        const response = await fetch(`/api/team/${memberId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editTeamModal')).hide();
            loadTeam();
        } else {
            throw new Error('Failed to update team member');
        }
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
                const response = await fetch(`/api/team/${memberId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
        const response = await fetch('/api/bookings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const bookings = await response.json();
        const tbody = document.getElementById('bookings-table-body');
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
    switch (status) {
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
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
            const response = await fetch(`/api/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
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
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
                const response = await fetch(`/api/bookings/${bookingId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
