// --- Application State Manager ---
const AppState = {
    currentRole: 'owner', // 'owner', 'petowner', 'vet'
    currentView: 'dashboard',
    
    // Mock Database
    pets: [
        { id: 1, name: 'Coco', type: 'Dog', birthDate: '2022-03-12', owner: 'Rocío Morato', visitsCount: 3 },
        { id: 2, name: 'Milo', type: 'Cat', birthDate: '2023-06-20', owner: 'Santiago Diestro', visitsCount: 1 },
        { id: 3, name: 'Luna', type: 'Rabbit', birthDate: '2024-01-15', owner: 'Gregorio Zamora', visitsCount: 0 }
    ],
    
    hotelRooms: [
        { id: 1, name: 'Basic Suite', type: 'Basic', price: 5, capacity: 5, occupied: 2 },
        { id: 2, name: 'Gold Suite', type: 'Gold', price: 10, capacity: 10, occupied: 4 },
        { id: 3, name: 'Platinum Suite', type: 'Platinum', price: 15, capacity: 3, occupied: 1 }
    ],
    
    bookings: [
        { id: 1, petName: 'Coco', roomName: 'Platinum Suite', startDate: '2026-06-20', endDate: '2026-06-25', status: 'Confirmed' }
    ],
    
    adoptions: [
        { id: 1, petName: 'Thor', type: 'Dog', age: '2 years', desc: 'Very playful and friendly, great with families.', status: 'Available', applicationsCount: 2 },
        { id: 2, petName: 'Simba', type: 'Cat', age: '1 year', desc: 'Calm and used to living indoors.', status: 'Available', applicationsCount: 0 }
    ],
    
    tickets: [
        { id: 'I-001347', title: 'Access control failure on pricing plans for owners', type: 'Incident', priority: 'P2', status: 'Resolved', tto: '4h (Limit: 3d)', ttr: '24h (Limit: 5d)', slaStatus: 'WITHIN' },
        { id: 'I-001509', title: 'Server crash on Google App Engine', type: 'Incident', priority: 'P1', status: 'Resolved', tto: '15m (Limit: 12h)', ttr: '4h (Limit: 2d)', slaStatus: 'WITHIN' },
        { id: 'R-001427', title: 'Service Request: Add rabbit as a pet type', type: 'Request', priority: 'P3', status: 'Open', tto: '2h (Limit: 4d)', ttr: 'In progress (Limit: 7d)', slaStatus: 'WITHIN' }
    ],
    
    // SLA Statistics
    slaStats: {
        totalTickets: 3,
        resolvedTickets: 2,
        slaCompliance: 100, // %
        avgResolutionTime: '14.5 hours',
        activeDiscount: 'None (100% SLA met)'
    }
};

// ITSM Priority Matrix: Impact x Urgency
const PriorityMatrix = {
    calculate: (impact, urgency) => {
        if (impact === 'High' && urgency === 'High') return 'P1';
        if (impact === 'High' || urgency === 'High') {
            if (impact === 'Low' || urgency === 'Low') return 'P3';
            return 'P2';
        }
        return 'P3';
    }
};

// --- DOM References & Initializations ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initRoleSelector();
    initArchitectureTabs();
    
    // Initial Render
    renderCurrentView();
});

// --- View Router / Controller ---
function renderCurrentView() {
    const container = document.getElementById('app-view-container');
    if (!container) return;
    
    // Clear content
    container.innerHTML = '';
    
    switch(AppState.currentView) {
        case 'dashboard':
            renderDashboardView(container);
            break;
        case 'pets':
            renderPetsView(container);
            break;
        case 'hotel':
            renderHotelView(container);
            break;
        case 'adoptions':
            renderAdoptionsView(container);
            break;
        case 'itsm':
            renderItsmView(container);
            break;
        default:
            renderDashboardView(container);
    }
}

// --- Navigation Controller ---
function initNavigation() {
    const menuButtons = document.querySelectorAll('.menu-item');
    menuButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class
            menuButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class
            const target = e.currentTarget;
            target.classList.add('active');
            
            // Set view & render
            AppState.currentView = target.getAttribute('data-view');
            renderCurrentView();
        });
    });
}

function initRoleSelector() {
    const select = document.getElementById('role-select');
    const badge = document.getElementById('current-user-badge');
    
    if (select && badge) {
        select.addEventListener('change', (e) => {
            AppState.currentRole = e.target.value;
            
            // Update UI Labels depending on Role
            if (AppState.currentRole === 'owner') {
                badge.innerText = 'Clinic Owner (Santiago D.)';
                document.querySelector('.badge-plan').innerText = 'PLATINUM';
            } else if (AppState.currentRole === 'petowner') {
                badge.innerText = 'Pet Owner (Client)';
                document.querySelector('.badge-plan').innerText = 'GOLD';
            } else {
                badge.innerText = 'Veterinarian (Santiago P.)';
                document.querySelector('.badge-plan').innerText = 'BASIC';
            }
            
            // Update active sidebar options based on role
            updateSidebarForRole();
            
            // Return to dashboard and re-render
            AppState.currentView = 'dashboard';
            
            const menuButtons = document.querySelectorAll('.menu-item');
            menuButtons.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-view') === 'dashboard') {
                    b.classList.add('active');
                }
            });
            
            renderCurrentView();
        });
    }
}

function updateSidebarForRole() {
    const hotelBtn = document.querySelector('[data-view="hotel"]');
    const adoptionsBtn = document.querySelector('[data-view="adoptions"]');
    
    if (AppState.currentRole === 'vet') {
        // Veterinarians don't see hotel bookings or adoptions
        if (hotelBtn) hotelBtn.style.display = 'none';
        if (adoptionsBtn) adoptionsBtn.style.display = 'none';
    } else {
        if (hotelBtn) hotelBtn.style.display = 'flex';
        if (adoptionsBtn) adoptionsBtn.style.display = 'flex';
    }
}

function initArchitectureTabs() {
    const tabs = document.querySelectorAll('.arch-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const targetId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.arch-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ==========================================
// RENDERERS FOR INDIVIDUAL SIMULATOR VIEWS
// ==========================================

// --- VIEW: Dashboard ---
function renderDashboardView(container) {
    const activePets = AppState.pets.length;
    const totalBookings = AppState.bookings.length;
    const openTickets = AppState.tickets.filter(t => t.status === 'Open').length;
    const slaPercent = AppState.slaStats.slaCompliance;
    
    container.innerHTML = `
        <h3 class="view-title">Dashboard</h3>
        <p class="view-subtitle">General operational summary of the clinic for the active role.</p>
        
        <div class="dashboard-stats">
            <div class="dashboard-card">
                <div class="card-icon-container"><i class="fa-solid fa-dog"></i></div>
                <div>
                    <div class="dash-card-val">${activePets}</div>
                    <div class="dash-card-lbl">Active Pets</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon-container green"><i class="fa-solid fa-hotel"></i></div>
                <div>
                    <div class="dash-card-val">${totalBookings}</div>
                    <div class="dash-card-lbl">Hotel Bookings</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon-container orange"><i class="fa-solid fa-ticket"></i></div>
                <div>
                    <div class="dash-card-val">${openTickets}</div>
                    <div class="dash-card-lbl">Open Tickets</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon-container blue"><i class="fa-solid fa-clock"></i></div>
                <div>
                    <div class="dash-card-val">${slaPercent}%</div>
                    <div class="dash-card-lbl">SLA Target</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-details-grid">
            <div class="panel-block">
                <h4><i class="fa-solid fa-bell"></i> Recent System Activity</h4>
                <table class="panel-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event</th>
                            <th>Responsible</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Today 19:40h</td>
                            <td>New pet added (Luna)</td>
                            <td>Gregorio Z.</td>
                            <td><span class="table-badge success">Completed</span></td>
                        </tr>
                        <tr>
                            <td>Yesterday 15:30h</td>
                            <td>Boarding booked in Platinum Suite</td>
                            <td>Santiago D.</td>
                            <td><span class="table-badge success">Confirmed</span></td>
                        </tr>
                        <tr>
                            <td>May 18</td>
                            <td>SLA Ticket Monitor (I-001509) closed</td>
                            <td>Santiago D.</td>
                            <td><span class="table-badge success">SLA OK</span></td>
                        </tr>
                        <tr>
                            <td>May 15</td>
                            <td>Adoption application submitted for "Thor"</td>
                            <td>Rocío M.</td>
                            <td><span class="table-badge pending">Pending</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="panel-block">
                <h4><i class="fa-solid fa-credit-card"></i> Subscription & Add-ons (SPACE)</h4>
                <div class="pricing-preview-list">
                    <div class="pricing-preview-item ${AppState.currentRole === 'vet' ? 'active' : ''}">
                        <div>
                            <strong>Basic Plan</strong>
                            <div class="dash-card-lbl">1 Max Pet · 2 Visits / month</div>
                        </div>
                        <div><strong>5.00€ <span class="dash-card-lbl">/mo</span></strong></div>
                    </div>
                    <div class="pricing-preview-item ${AppState.currentRole === 'petowner' ? 'active' : ''}">
                        <div>
                            <strong>Gold Plan</strong>
                            <div class="dash-card-lbl">3 Max Pets · Adoptions enabled</div>
                        </div>
                        <div><strong>10.00€ <span class="dash-card-lbl">/mo</span></strong></div>
                    </div>
                    <div class="pricing-preview-item ${AppState.currentRole === 'owner' ? 'active' : ''}">
                        <div>
                            <strong>Platinum Plan</strong>
                            <div class="dash-card-lbl">Unlimited Pets · Hotel · Online Consultations</div>
                        </div>
                        <div><strong>15.00€ <span class="dash-card-lbl">/mo</span></strong></div>
                    </div>
                    <div class="pricing-preview-item" style="border-style: dashed; background: rgba(124, 77, 255, 0.02)">
                        <div>
                            <strong>Add-on: Cat Breed Search (Cat API)</strong>
                            <div class="dash-card-lbl">External API integration for cat breed details</div>
                        </div>
                        <div><strong>+3.00€ <span class="dash-card-lbl">/mo</span></strong></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- VIEW: Pets & Visits ---
function renderPetsView(container) {
    let petsRows = AppState.pets.map(pet => `
        <tr>
            <td><strong>${pet.id}</strong></td>
            <td>${pet.name}</td>
            <td><span class="table-badge success">${pet.type}</span></td>
            <td>${pet.birthDate}</td>
            <td>${pet.owner}</td>
            <td>${pet.visitsCount} visits</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="addVisitToPet(${pet.id})">
                    <i class="fa-solid fa-notes-medical"></i> Log Visit
                </button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="pets-top-actions">
            <div>
                <h3 class="view-title">My Pets & Clinical Records</h3>
                <p class="view-subtitle">Register new pets and associate clinical visits to their history.</p>
            </div>
            ${AppState.currentRole !== 'vet' ? `
                <button class="btn btn-primary btn-sm" id="btn-add-pet">
                    <i class="fa-solid fa-plus"></i> New Pet
                </button>
            ` : ''}
        </div>
        
        <div id="add-pet-form-container" style="display:none; margin-bottom: 25px;" class="panel-block">
            <h4><i class="fa-solid fa-dog"></i> Registration Form</h4>
            <form id="add-pet-form" onsubmit="handlePetSubmit(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pet-name">Pet Name</label>
                        <input type="text" id="pet-name" required placeholder="E.g. Bobby">
                    </div>
                    <div class="form-group">
                        <label for="pet-type">Species</label>
                        <select id="pet-type">
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Rabbit">Rabbit (Service Request)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pet-birth">Birth Date</label>
                        <input type="date" id="pet-birth" required>
                    </div>
                    <div class="form-group">
                        <label for="pet-owner">Owner Name</label>
                        <input type="text" id="pet-owner" value="${AppState.currentRole === 'owner' ? 'Santiago Diestro' : 'Client Owner'}" required>
                    </div>
                </div>
                <div style="display:flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="toggleAddPetForm(false)">Cancel</button>
                    <button type="submit" class="btn btn-primary btn-sm">Save Pet</button>
                </div>
            </form>
        </div>

        <div class="panel-block">
            <table class="panel-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Birth Date</th>
                        <th>Owner</th>
                        <th>Visits</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${petsRows}
                </tbody>
            </table>
        </div>
    `;

    // Event listener for toggle button
    const addBtn = document.getElementById('btn-add-pet');
    if (addBtn) {
        addBtn.addEventListener('click', () => toggleAddPetForm(true));
    }
}

function toggleAddPetForm(show) {
    const form = document.getElementById('add-pet-form-container');
    if (form) form.style.display = show ? 'block' : 'none';
}

window.handlePetSubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('pet-name').value;
    const type = document.getElementById('pet-type').value;
    const birthDate = document.getElementById('pet-birth').value;
    const owner = document.getElementById('pet-owner').value;
    
    const newId = AppState.pets.length + 1;
    AppState.pets.push({ id: newId, name, type, birthDate, owner, visitsCount: 0 });
    
    renderCurrentView();
};

window.addVisitToPet = function(petId) {
    const pet = AppState.pets.find(p => p.id === petId);
    if (!pet) return;
    
    // Simulate logging a visit
    pet.visitsCount += 1;
    alert(`Clinical visit successfully logged for ${pet.name}. The pet's medical record has been updated.`);
    renderCurrentView();
};

// --- VIEW: Hotel Booking ---
function renderHotelView(container) {
    let bookingsRows = AppState.bookings.map(book => `
        <tr>
            <td>${book.petName}</td>
            <td><span class="table-badge success">${book.roomName}</span></td>
            <td>${book.startDate}</td>
            <td>${book.endDate}</td>
            <td><span class="table-badge success">${book.status}</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <h3 class="view-title">Pet Hotel (Boarding Care)</h3>
        <p class="view-subtitle">Manage rooms and boarding stays to take care of pets during owners' absences.</p>
        
        <div class="hotel-room-grid">
            ${AppState.hotelRooms.map(room => `
                <div class="room-card ${room.type === 'Platinum' ? 'selected' : ''}" onclick="selectRoom('${room.name}', ${room.price})">
                    <div class="room-icon"><i class="fa-solid fa-hotel"></i></div>
                    <h5>${room.name}</h5>
                    <div class="room-price">${room.price}.00€ <span class="dash-card-lbl">/ night</span></div>
                    <ul class="room-features">
                        <li>Capacity: ${room.capacity} pets</li>
                        <li>Occupied: ${room.occupied} rooms</li>
                        <li>SLA Plan: ${room.type}</li>
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <div class="dashboard-details-grid">
            <div class="panel-block">
                <h4><i class="fa-solid fa-calendar-plus"></i> Book a Suite</h4>
                <form onsubmit="handleHotelSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="hotel-pet">Select Pet</label>
                            <select id="hotel-pet">
                                ${AppState.pets.map(p => `<option value="${p.name}">${p.name} (${p.type})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="hotel-room">Selected Suite</label>
                            <input type="text" id="hotel-room" value="Platinum Suite" readonly>
                        </div>
                        <div class="form-group">
                            <label for="hotel-start">Check-in Date</label>
                            <input type="date" id="hotel-start" value="2026-06-22" required>
                        </div>
                        <div class="form-group">
                            <label for="hotel-end">Check-out Date</label>
                            <input type="date" id="hotel-end" value="2026-06-27" required>
                        </div>
                    </div>
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                        <span class="dash-card-lbl">Estimated Price: <strong id="hotel-price-label">15.00€ / night</strong></span>
                        <button type="submit" class="btn btn-primary btn-sm">Confirm Booking</button>
                    </div>
                </form>
            </div>
            
            <div class="panel-block">
                <h4><i class="fa-solid fa-calendar-days"></i> Active Boardings</h4>
                <table class="panel-table">
                    <thead>
                        <tr>
                            <th>Pet</th>
                            <th>Suite</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookingsRows.length > 0 ? bookingsRows : '<tr><td colspan="5" style="text-align:center;">No boarding bookings recorded.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.selectRoom = function(roomName, price) {
    const input = document.getElementById('hotel-room');
    const label = document.getElementById('hotel-price-label');
    if (input) input.value = roomName;
    if (label) label.innerHTML = `${price}.00€ / night`;
    
    // Highlight selected card visually
    const cards = document.querySelectorAll('.room-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        if (card.querySelector('h5').innerText === roomName) {
            card.classList.add('selected');
        }
    });
};

window.handleHotelSubmit = function(e) {
    e.preventDefault();
    const petName = document.getElementById('hotel-pet').value;
    const roomName = document.getElementById('hotel-room').value;
    const startDate = document.getElementById('hotel-start').value;
    const endDate = document.getElementById('hotel-end').value;
    
    AppState.bookings.push({
        id: AppState.bookings.length + 1,
        petName,
        roomName,
        startDate,
        endDate,
        status: 'Confirmed'
    });
    
    alert(`Boarding suite booking confirmed for ${petName} in ${roomName} from ${startDate} to ${endDate}.`);
    renderCurrentView();
};

// --- VIEW: Adoption Center ---
function renderAdoptionsView(container) {
    let adoptionsCards = AppState.adoptions.map(ad => `
        <div class="panel-block" style="margin-bottom: 20px;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin-bottom:0;"><i class="fa-solid fa-hand-holding-heart text-danger"></i> Pet: ${ad.petName} (${ad.type})</h4>
                <span class="table-badge success">${ad.status}</span>
            </div>
            <p class="dash-card-lbl" style="font-size:0.9rem; margin-bottom:15px;">${ad.desc}</p>
            <div style="display:flex; justify-content: space-between; align-items: center; border-top:1px solid rgba(255,255,255,0.04); padding-top:15px;">
                <span class="dash-card-lbl">Approximate Age: <strong>${ad.age}</strong></span>
                <div>
                    <span class="dash-card-lbl" style="margin-right:15px;">Applications: <strong>${ad.applicationsCount}</strong></span>
                    <button class="btn btn-primary btn-sm" onclick="applyForAdoption(${ad.id})">
                        <i class="fa-solid fa-file-signature"></i> Apply for Adoption
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <h3 class="view-title">Adoption Center</h3>
        <p class="view-subtitle">Help abandoned pets find their forever home and link them with caring adoptants.</p>
        
        <div class="dashboard-details-grid">
            <div>
                <h4><i class="fa-solid fa-paw"></i> Pets Available for Adoption</h4>
                ${adoptionsCards}
            </div>
            
            <div class="panel-block" style="align-self: flex-start;">
                <h4><i class="fa-solid fa-bullhorn"></i> Post Pet for Adoption</h4>
                <form onsubmit="handleAdoptionSubmit(event)">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-name">Pet Name</label>
                        <input type="text" id="adopt-name" required placeholder="E.g. Thor">
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-type">Species</label>
                        <select id="adopt-type">
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Rabbit">Rabbit</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-age">Approximate Age</label>
                        <input type="text" id="adopt-age" placeholder="E.g. 6 months" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="adopt-desc">Description / Story</label>
                        <textarea id="adopt-desc" rows="3" placeholder="Provide details about their character, health status, story..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-plus"></i> Post on Catalog
                    </button>
                </form>
            </div>
        </div>
    `;
}

window.applyForAdoption = function(id) {
    const item = AppState.adoptions.find(a => a.id === id);
    if (item) {
        item.applicationsCount += 1;
        alert(`Your adoption application for "${item.petName}" has been successfully submitted. We will review your profile shortly.`);
        renderCurrentView();
    }
};

window.handleAdoptionSubmit = function(e) {
    e.preventDefault();
    const petName = document.getElementById('adopt-name').value;
    const type = document.getElementById('adopt-type').value;
    const age = document.getElementById('adopt-age').value;
    const desc = document.getElementById('adopt-desc').value;
    
    AppState.adoptions.push({
        id: AppState.adoptions.length + 1,
        petName,
        type,
        age,
        desc,
        status: 'Available',
        applicationsCount: 0
    });
    
    alert(`The pet "${petName}" has been successfully listed in the public adoption catalog.`);
    renderCurrentView();
};

// --- VIEW: ITSM / SLA Monitor ---
function renderItsmView(container) {
    let ticketsRows = AppState.tickets.map(t => {
        let statusBadgeClass = t.slaStatus === 'WITHIN' ? 'success' : 'danger';
        let priorityBadgeClass = '';
        if (t.priority === 'P1') priorityBadgeClass = 'priority-p1';
        else if (t.priority === 'P2') priorityBadgeClass = 'priority-p2';
        else priorityBadgeClass = 'priority-p3';
        
        return `
            <div class="ticket-item">
                <div class="ticket-header">
                    <span class="ticket-id">${t.id} (${t.type})</span>
                    <span class="ticket-priority-badge ${priorityBadgeClass}">${t.priority}</span>
                </div>
                <div class="ticket-desc">${t.title}</div>
                <div class="ticket-sla-stats">
                    <span>TTO (Response): <strong>${t.tto}</strong></span>
                    <span>TTR (Resolution): <strong>${t.ttr}</strong></span>
                    <span>SLA Status: <span class="table-badge ${statusBadgeClass}">${t.slaStatus} SLA</span></span>
                </div>
                ${t.status === 'Open' ? `
                    <div class="ticket-actions">
                        <button class="btn btn-primary btn-sm" onclick="resolveTicket('${t.id}')">
                            <i class="fa-solid fa-check"></i> Resolve Ticket
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <h3 class="view-title">SLA & Ticket Monitor (iTop ITSM Simulation)</h3>
        <p class="view-subtitle">Simulate incident and service request response (TTO) and resolution (TTR) times defined in the Customer Agreement.</p>
        
        <div class="itsm-dashboard">
            <div class="panel-block itsm-ticket-form">
                <h4><i class="fa-solid fa-bug-slash"></i> Log New Incident / Request</h4>
                <form onsubmit="handleTicketSubmit(event)">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label for="t-title">Ticket / Issue Title</label>
                        <input type="text" id="t-title" required placeholder="E.g. Error 500 when saving visits">
                    </div>
                    <div class="form-grid" style="margin-bottom:12px;">
                        <div class="form-group">
                            <label for="t-type">Type</label>
                            <select id="t-type">
                                <option value="Incident">Incident (Bug)</option>
                                <option value="Request">Service Request</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="t-plan">Client SLA Plan</label>
                            <select id="t-plan">
                                <option value="platinum">Platinum (Priority)</option>
                                <option value="gold">Gold (Standard)</option>
                                <option value="basic">Basic (No SLA)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-grid" style="margin-bottom:15px;">
                        <div class="form-group">
                            <label for="t-impact">Business Impact</label>
                            <select id="t-impact">
                                <option value="High">High (Service down)</option>
                                <option value="Medium">Medium (Module error)</option>
                                <option value="Low">Low (Cosmetic issue)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="t-urgency">Operational Urgency</label>
                            <select id="t-urgency">
                                <option value="High">High (Immediate attention needed)</option>
                                <option value="Medium">Medium (Workaround available)</option>
                                <option value="Low">Low (Non-urgent)</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-paper-plane"></i> Create iTop Ticket
                    </button>
                </form>
                
                <div class="priority-matrix-info">
                    <strong>ITSM Priority Matrix (Calculated):</strong><br>
                    - High Impact + High Urgency = <strong>P1 (Critical)</strong><br>
                    - Medium Impact + Medium/Low Urgency = <strong>P3 (Standard)</strong>
                </div>
            </div>
            
            <div class="itsm-tickets-panel">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <h4><i class="fa-solid fa-list-check"></i> iTop Ticket Queue</h4>
                    <span class="dash-card-lbl">Global SLA Compliance: <strong class="text-success">${AppState.slaStats.slaCompliance}%</strong></span>
                </div>
                ${ticketsRows}
            </div>
        </div>
    `;
}

window.handleTicketSubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById('t-title').value;
    const type = document.getElementById('t-type').value;
    const plan = document.getElementById('t-plan').value;
    const impact = document.getElementById('t-impact').value;
    const urgency = document.getElementById('t-urgency').value;
    
    // Calculate Priority using Matrix
    const priority = PriorityMatrix.calculate(impact, urgency);
    
    // Generate simulated SLA targets
    let limitTto = '2 days';
    let limitTtr = '5 days';
    if (plan === 'platinum') {
        if (priority === 'P1') { limitTto = '12 hours'; limitTtr = '2 days'; }
        else if (priority === 'P2') { limitTto = '24 hours'; limitTtr = '4 days'; }
        else { limitTto = '2 days'; limitTtr = '6 days'; }
    } else if (plan === 'gold') {
        if (priority === 'P1') { limitTto = '2 days'; limitTtr = '4 days'; }
        else if (priority === 'P2') { limitTto = '3 days'; limitTtr = '5 days'; }
        else { limitTto = '4 days'; limitTtr = '7 days'; }
    } else {
        limitTto = 'No SLA';
        limitTtr = 'No SLA';
    }
    
    const prefix = type === 'Incident' ? 'I-' : 'R-';
    const newId = prefix + '00' + (1427 + AppState.tickets.length);
    
    AppState.tickets.push({
        id: newId,
        title,
        type,
        priority,
        status: 'Open',
        tto: `In progress (Limit: ${limitTto})`,
        ttr: `In progress (Limit: ${limitTtr})`,
        slaStatus: 'WITHIN',
        plan,
        limitTtrVal: limitTtr
    });
    
    AppState.slaStats.totalTickets += 1;
    
    alert(`Ticket ${newId} registered with priority ${priority}. The SLA timer has started.`);
    renderCurrentView();
};

window.resolveTicket = function(ticketId) {
    const ticket = AppState.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Simulate resolution time
    // We let the user simulate whether it resolved on-time or delayed to show ITSM SLA calculations
    const onTime = confirm(`Do you want to simulate that ticket ${ticketId} resolved WITHIN the SLA target?\n(Clicking Cancel will simulate a delay to show service credit calculations)`);
    
    ticket.status = 'Resolved';
    
    if (onTime) {
        ticket.tto = '1 hour (SLA Met)';
        ticket.ttr = '12 hours (SLA Met)';
        ticket.slaStatus = 'WITHIN';
    } else {
        ticket.tto = '12 hours (SLA Violated)';
        ticket.ttr = '10 days (SLA Violated)';
        ticket.slaStatus = 'OUT';
    }
    
    // Recalculate stats
    const total = AppState.tickets.length;
    const resolved = AppState.tickets.filter(t => t.status === 'Resolved');
    const withinSla = resolved.filter(t => t.slaStatus === 'WITHIN').length;
    
    AppState.slaStats.resolvedTickets = resolved.length;
    AppState.slaStats.slaCompliance = Math.round((withinSla / resolved.length) * 100);
    
    if (AppState.slaStats.slaCompliance < 100) {
        AppState.slaStats.activeDiscount = '10% subscription credit applied on the next invoice due to SLA violation (TTR > 30% threshold)';
    } else {
        AppState.slaStats.activeDiscount = 'None (100% SLA met)';
    }
    
    alert(`Ticket ${ticketId} marked as Resolved. SLA Status: ${ticket.slaStatus}.\nActive compensation: ${AppState.slaStats.activeDiscount}`);
    renderCurrentView();
};
