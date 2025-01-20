document.addEventListener('DOMContentLoaded', () => {
    // Load services
    fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            const servicesList = document.getElementById('services-list');
            servicesList.innerHTML = services.map(service => `
                <div class="service">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <p>Price: ${service.price} NOK</p>
                </div>
            `).join('');
        });

    // Load team members
    fetch('/api/team')
        .then(response => response.json())
        .then(team => {
            const teamList = document.getElementById('team-list');
            teamList.innerHTML = team.map(member => `
                <div class="team-member">
                    <h3>${member.name}</h3>
                    <p>${member.role}</p>
                </div>
            `).join('');
        });
});
