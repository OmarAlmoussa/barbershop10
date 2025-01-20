document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointment-form');
    const serviceSelect = document.getElementById('service');

    // Load services
    fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            serviceSelect.innerHTML = services.map(service => 
                `<option value="${service._id}">${service.name} - ${service.price} NOK</option>`
            ).join('');
        });

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bookingData = {
            service: serviceSelect.value,
            customerName: document.getElementById('customerName').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                alert('Booking successful! We will contact you to confirm your appointment.');
                form.reset();
            } else {
                throw new Error('Booking failed');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book appointment. Please try again.');
        }
    });
});
