document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    });

    // Load dynamic content
    loadServices();
    loadTeamMembers();
    loadGallery();
    initializeMaps();
    setupBookingForm();
    setupLanguageToggle();
});

// Load Services
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        const container = document.getElementById('services-container');
        
        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.setAttribute('data-aos', 'fade-up');
            serviceCard.innerHTML = `
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <p class="price">NOK ${service.price}</p>
            `;
            container.appendChild(serviceCard);
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load Team Members
async function loadTeamMembers() {
    try {
        const response = await fetch('/api/team');
        const team = await response.json();
        const container = document.getElementById('team-container');
        
        team.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'team-member';
            memberCard.setAttribute('data-aos', 'fade-up');
            memberCard.innerHTML = `
                <img src="${member.image}" alt="${member.name}">
                <h3>${member.name}</h3>
                <p>${member.role}</p>
                <p>${member.bio}</p>
            `;
            container.appendChild(memberCard);
        });
    } catch (error) {
        console.error('Error loading team:', error);
    }
}

// Load Gallery
async function loadGallery() {
    try {
        const response = await fetch('/api/gallery');
        const gallery = await response.json();
        const container = document.getElementById('gallery-container');
        
        gallery.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.setAttribute('data-aos', 'fade-up');
            galleryItem.innerHTML = `
                <img src="${item.url}" alt="${item.title}">
            `;
            container.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Initialize Google Maps
function initializeMaps() {
    // Sandnes Map
    const sandnesMap = new google.maps.Map(document.getElementById('sandnes-map'), {
        center: { lat: 58.8517, lng: 5.7347 },
        zoom: 15
    });
    new google.maps.Marker({
        position: { lat: 58.8517, lng: 5.7347 },
        map: sandnesMap,
        title: 'Moon Barbershop Sandnes'
    });

    // Klepp Map
    const kleppMap = new google.maps.Map(document.getElementById('klepp-map'), {
        center: { lat: 58.7889, lng: 5.6345 },
        zoom: 15
    });
    new google.maps.Marker({
        position: { lat: 58.7889, lng: 5.6345 },
        map: kleppMap,
        title: 'Moon Barbershop Klepp'
    });
}

// Setup Booking Form
function setupBookingForm() {
    const form = document.getElementById('booking-form');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const serviceSelect = document.getElementById('service');
    const barberSelect = document.getElementById('barber');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Load services
    loadServiceOptions();

    // Load barbers
    loadBarberOptions();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: form.name.value,
            phone: form.phone.value,
            email: form.email.value,
            service: form.service.value,
            barber: form.barber.value,
            date: form.date.value,
            time: form.time.value
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Booking successful! We will send you a confirmation email.');
                form.reset();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create booking. Please try again.');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking. Please try again.');
        }
    });

    // Update available times when date or barber changes
    dateInput.addEventListener('change', updateAvailableTimes);
    barberSelect.addEventListener('change', updateAvailableTimes);
}

// Load service options
async function loadServiceOptions() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        const serviceSelect = document.getElementById('service');
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service._id;
            option.textContent = `${service.name} - NOK ${service.price}`;
            serviceSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load barber options
async function loadBarberOptions() {
    try {
        const response = await fetch('/api/team');
        const barbers = await response.json();
        const barberSelect = document.getElementById('barber');
        
        barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber._id;
            option.textContent = barber.name;
            barberSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading barbers:', error);
    }
}

// Update available times
async function updateAvailableTimes() {
    const date = document.getElementById('date').value;
    const barber = document.getElementById('barber').value;
    const timeSelect = document.getElementById('time');
    
    if (!date || !barber) return;

    try {
        const response = await fetch(`/api/available-times?date=${date}&barber=${barber}`);
        const availableTimes = await response.json();
        
        // Clear existing options
        timeSelect.innerHTML = '<option value="">Velg tid</option>';
        
        // Add available times
        availableTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available times:', error);
    }
}

// Language Toggle
function setupLanguageToggle() {
    const langToggle = document.querySelector('.lang-toggle');
    let currentLang = 'no'; // Default to Norwegian
    
    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'no' ? 'en' : 'no';
        document.documentElement.setAttribute('lang', currentLang);
        translateContent(currentLang);
    });
}

// Translate content based on language
function translateContent(lang) {
    const translations = {
        no: {
            home: 'Hjem',
            services: 'Tjenester',
            team: 'Team',
            booking: 'Bestilling',
            contact: 'Kontakt',
            welcome: 'Velkommen til Moon Barbershop',
            bookNow: 'Bestill Nå',
            // Add more translations as needed
        },
        en: {
            home: 'Home',
            services: 'Services',
            team: 'Team',
            booking: 'Booking',
            contact: 'Contact',
            welcome: 'Welcome to Moon Barbershop',
            bookNow: 'Book Now',
            // Add more translations as needed
        }
    };
    
    // Update text content based on selected language
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}
