document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointment-form');
    const serviceSelect = document.getElementById('service');
    const barberSelect = document.getElementById('barber');
    const serviceDetails = document.getElementById('service-details');
    const barberDetails = document.getElementById('barber-details');
    const summaryDetails = document.getElementById('summary-details');
    const totalPrice = document.getElementById('total-price');

    let selectedService = null;
    let selectedBarber = null;

    // Load services
    fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            const options = ['<option value="">Select a service...</option>'];
            services.forEach(service => {
                options.push(`<option value="${service._id}" 
                    data-price="${service.price}" 
                    data-description="${service.description}">${service.name}</option>`);
            });
            serviceSelect.innerHTML = options.join('');
        })
        .catch(error => {
            console.error('Error loading services:', error);
            serviceSelect.innerHTML = '<option value="">Error loading services</option>';
        });

    // Load team members (barbers)
    fetch('/api/team')
        .then(response => response.json())
        .then(team => {
            const options = ['<option value="">Select a barber...</option>'];
            team.forEach(member => {
                options.push(`<option value="${member._id}"
                    data-bio="${member.bio || ''}">${member.name}</option>`);
            });
            barberSelect.innerHTML = options.join('');
        })
        .catch(error => {
            console.error('Error loading team members:', error);
            barberSelect.innerHTML = '<option value="">Error loading barbers</option>';
        });

    // Service selection handler
    serviceSelect.addEventListener('change', () => {
        const selected = serviceSelect.options[serviceSelect.selectedIndex];
        if (selected.value) {
            selectedService = {
                id: selected.value,
                name: selected.text,
                price: parseFloat(selected.dataset.price),
                description: selected.dataset.description
            };
            serviceDetails.innerHTML = `
                <p><strong>Description:</strong> ${selectedService.description}</p>
                <p><strong>Price:</strong> ${selectedService.price.toFixed(2)} NOK</p>
            `;
            serviceDetails.classList.add('active');
        } else {
            selectedService = null;
            serviceDetails.innerHTML = '';
            serviceDetails.classList.remove('active');
        }
        updateSummary();
    });

    // Barber selection handler
    barberSelect.addEventListener('change', () => {
        const selected = barberSelect.options[barberSelect.selectedIndex];
        if (selected.value) {
            selectedBarber = {
                id: selected.value,
                name: selected.text,
                bio: selected.dataset.bio
            };
            barberDetails.innerHTML = `
                <p><strong>About:</strong> ${selectedBarber.bio || 'No bio available'}</p>
            `;
            barberDetails.classList.add('active');
        } else {
            selectedBarber = null;
            barberDetails.innerHTML = '';
            barberDetails.classList.remove('active');
        }
        updateSummary();
    });

    // Update booking summary
    function updateSummary() {
        if (selectedService || selectedBarber) {
            let summary = '';
            if (selectedService) {
                summary += `<p><strong>Service:</strong> ${selectedService.name}</p>`;
            }
            if (selectedBarber) {
                summary += `<p><strong>Barber:</strong> ${selectedBarber.name}</p>`;
            }
            summaryDetails.innerHTML = summary;
            totalPrice.textContent = selectedService ? `${selectedService.price.toFixed(2)} NOK` : '0.00 NOK';
        } else {
            summaryDetails.innerHTML = '<p>Please select a service and barber</p>';
            totalPrice.textContent = '0.00 NOK';
        }
    }

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            service: selectedService.id,
            barber: selectedBarber.id,
            customerName: document.getElementById('customerName').value,
            customerEmail: document.getElementById('customerEmail').value,
            customerPhone: document.getElementById('customerPhone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create booking');
            }

            // Show success message
            alert('Booking successful! We will confirm your appointment soon.');
            form.reset();
            
            // Reset selected service and barber
            selectedService = null;
            selectedBarber = null;
            updateSummary();
            
        } catch (error) {
            alert(error.message);
        }
    });
});
