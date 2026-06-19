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
        { id: 1, name: 'Suite Básica', type: 'Basic', price: 5, capacity: 5, occupied: 2 },
        { id: 2, name: 'Suite Oro', type: 'Gold', price: 10, capacity: 10, occupied: 4 },
        { id: 3, name: 'Suite Platino', type: 'Platinum', price: 15, capacity: 3, occupied: 1 }
    ],
    
    bookings: [
        { id: 1, petName: 'Coco', roomName: 'Suite Platino', startDate: '2026-06-20', endDate: '2026-06-25', status: 'Confirmada' }
    ],
    
    adoptions: [
        { id: 1, petName: 'Thor', type: 'Dog', age: '2 años', desc: 'Muy juguetón y cariñoso, ideal para familias.', status: 'Disponible', applicationsCount: 2 },
        { id: 2, petName: 'Simba', type: 'Cat', age: '1 año', desc: 'Tranquilo y acostumbrado a interiores.', status: 'Disponible', applicationsCount: 0 }
    ],
    
    tickets: [
        { id: 'I-001347', title: 'Fallo acceso a pricing plans para owners', type: 'Incidencia', priority: 'P2', status: 'Resuelto', tto: '4h (Límite: 3d)', ttr: '24h (Límite: 5d)', slaStatus: 'DENTRO' },
        { id: 'I-001509', title: 'Caída de servidor en App Engine', type: 'Incidencia', priority: 'P1', status: 'Resuelto', tto: '15m (Límite: 12h)', ttr: '4h (Límite: 2d)', slaStatus: 'DENTRO' },
        { id: 'R-001427', title: 'Service Request: Añadir conejo como tipo de mascota', type: 'Petición', priority: 'P3', status: 'Abierto', tto: '2h (Límite: 4d)', ttr: 'En progreso (Límite: 7d)', slaStatus: 'DENTRO' }
    ],
    
    // SLA Statistics
    slaStats: {
        totalTickets: 3,
        resolvedTickets: 2,
        slaCompliance: 100, // %
        avgResolutionTime: '14.5 horas',
        activeDiscount: 'Ninguno (100% SLA cumplido)'
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
                badge.innerText = 'Pet Owner (Cliente)';
                document.querySelector('.badge-plan').innerText = 'GOLD';
            } else {
                badge.innerText = 'Veterinario (Santiago P.)';
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
    const openTickets = AppState.tickets.filter(t => t.status === 'Abierto').length;
    const slaPercent = AppState.slaStats.slaCompliance;
    
    container.innerHTML = `
        <h3 class="view-title">Panel de Control</h3>
        <p class="view-subtitle">Resumen operativo general de la veterinaria para el rol activo.</p>
        
        <div class="dashboard-stats">
            <div class="dashboard-card">
                <div class="card-icon-container"><i class="fa-solid fa-dog"></i></div>
                <div>
                    <div class="dash-card-val">${activePets}</div>
                    <div class="dash-card-lbl">Mascotas Activas</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon-container green"><i class="fa-solid fa-hotel"></i></div>
                <div>
                    <div class="dash-card-val">${totalBookings}</div>
                    <div class="dash-card-lbl">Reservas Hotel</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon-container orange"><i class="fa-solid fa-ticket"></i></div>
                <div>
                    <div class="dash-card-val">${openTickets}</div>
                    <div class="dash-card-lbl">Tickets Abiertos</div>
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
                <h4><i class="fa-solid fa-bell"></i> Actividad Reciente del Sistema</h4>
                <table class="panel-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Evento</th>
                            <th>Responsable</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Hoy 19:40h</td>
                            <td>Nueva mascota agregada (Luna)</td>
                            <td>Gregorio Z.</td>
                            <td><span class="table-badge success">Completado</span></td>
                        </tr>
                        <tr>
                            <td>Ayer 15:30h</td>
                            <td>Reserva en Suite Platino</td>
                            <td>Santiago D.</td>
                            <td><span class="table-badge success">Confirmado</span></td>
                        </tr>
                        <tr>
                            <td>18 de Mayo</td>
                            <td>SLA Ticket Monitor (I-001509) cerrado</td>
                            <td>Santiago D.</td>
                            <td><span class="table-badge success">SLA OK</span></td>
                        </tr>
                        <tr>
                            <td>15 de Mayo</td>
                            <td>Solicitud de Adopción de "Thor"</td>
                            <td>Rocío M.</td>
                            <td><span class="table-badge pending">Pendiente</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="panel-block">
                <h4><i class="fa-solid fa-credit-card"></i> Suscripción & Add-ons (SPACE)</h4>
                <div class="pricing-preview-list">
                    <div class="pricing-preview-item ${AppState.currentRole === 'vet' ? 'active' : ''}">
                        <div>
                            <strong>Plan Basic</strong>
                            <div class="dash-card-lbl">1 Mascota máx · 2 visitas / mes</div>
                        </div>
                        <div><strong>5.00€ <span class="dash-card-lbl">/mes</span></strong></div>
                    </div>
                    <div class="pricing-preview-item ${AppState.currentRole === 'petowner' ? 'active' : ''}">
                        <div>
                            <strong>Plan Gold</strong>
                            <div class="dash-card-lbl">3 Mascotas máx · Adopciones</div>
                        </div>
                        <div><strong>10.00€ <span class="dash-card-lbl">/mes</span></strong></div>
                    </div>
                    <div class="pricing-preview-item ${AppState.currentRole === 'owner' ? 'active' : ''}">
                        <div>
                            <strong>Plan Platinum</strong>
                            <div class="dash-card-lbl">Mascotas ilimitadas · Hotel · Consultas online</div>
                        </div>
                        <div><strong>15.00€ <span class="dash-card-lbl">/mes</span></strong></div>
                    </div>
                    <div class="pricing-preview-item" style="border-style: dashed; background: rgba(124, 77, 255, 0.02)">
                        <div>
                            <strong>Add-on: Buscador Felino (Cat API)</strong>
                            <div class="dash-card-lbl">Integración externa de razas de gatos</div>
                        </div>
                        <div><strong>+3.00€ <span class="dash-card-lbl">/mes</span></strong></div>
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
            <td>${pet.visitsCount} visitas</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="addVisitToPet(${pet.id})">
                    <i class="fa-solid fa-notes-medical"></i> Registrar Visita
                </button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="pets-top-actions">
            <div>
                <h3 class="view-title">Mis Mascotas & Historial Clínico</h3>
                <p class="view-subtitle">Registra nuevas mascotas y asocia visitas clínicas al historial.</p>
            </div>
            ${AppState.currentRole !== 'vet' ? `
                <button class="btn btn-primary btn-sm" id="btn-add-pet">
                    <i class="fa-solid fa-plus"></i> Nueva Mascota
                </button>
            ` : ''}
        </div>
        
        <div id="add-pet-form-container" style="display:none; margin-bottom: 25px;" class="panel-block">
            <h4><i class="fa-solid fa-dog"></i> Formulario de Registro</h4>
            <form id="add-pet-form" onsubmit="handlePetSubmit(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pet-name">Nombre de la Mascota</label>
                        <input type="text" id="pet-name" required placeholder="Ej. Bobby">
                    </div>
                    <div class="form-group">
                        <label for="pet-type">Especie</label>
                        <select id="pet-type">
                            <option value="Dog">Perro (Dog)</option>
                            <option value="Cat">Gato (Cat)</option>
                            <option value="Rabbit">Conejo (Rabbit) - Service Request</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pet-birth">Fecha de Nacimiento</label>
                        <input type="date" id="pet-birth" required>
                    </div>
                    <div class="form-group">
                        <label for="pet-owner">Propietario</label>
                        <input type="text" id="pet-owner" value="${AppState.currentRole === 'owner' ? 'Santiago Diestro' : 'Propietario Cliente'}" required>
                    </div>
                </div>
                <div style="display:flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="toggleAddPetForm(false)">Cancelar</button>
                    <button type="submit" class="btn btn-primary btn-sm">Guardar Mascota</button>
                </div>
            </form>
        </div>

        <div class="panel-block">
            <table class="panel-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Fecha de Nacimiento</th>
                        <th>Dueño</th>
                        <th>Visitas</th>
                        <th>Acción</th>
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
    alert(`Visita médica registrada con éxito para la mascota: ${pet.name}. El historial clínico ha sido actualizado.`);
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
        <h3 class="view-title">Hotel de Mascotas (Hospedaje)</h3>
        <p class="view-subtitle">Gestión de habitaciones y estancias para el cuidado de mascotas durante ausencias.</p>
        
        <div class="hotel-room-grid">
            ${AppState.hotelRooms.map(room => `
                <div class="room-card ${room.type === 'Platinum' ? 'selected' : ''}" onclick="selectRoom('${room.name}', ${room.price})">
                    <div class="room-icon"><i class="fa-solid fa-hotel"></i></div>
                    <h5>${room.name}</h5>
                    <div class="room-price">${room.price}.00€ <span class="dash-card-lbl">/ noche</span></div>
                    <ul class="room-features">
                        <li>Capacidad: ${room.capacity} mascotas</li>
                        <li>Ocupadas: ${room.occupied} habs.</li>
                        <li>Plan sugerido: ${room.type}</li>
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <div class="dashboard-details-grid">
            <div class="panel-block">
                <h4><i class="fa-solid fa-calendar-plus"></i> Reservar Habitación</h4>
                <form onsubmit="handleHotelSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="hotel-pet">Seleccionar Mascota</label>
                            <select id="hotel-pet">
                                ${AppState.pets.map(p => `<option value="${p.name}">${p.name} (${p.type})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="hotel-room">Suite Seleccionada</label>
                            <input type="text" id="hotel-room" value="Suite Platino" readonly>
                        </div>
                        <div class="form-group">
                            <label for="hotel-start">Fecha de Entrada</label>
                            <input type="date" id="hotel-start" value="2026-06-22" required>
                        </div>
                        <div class="form-group">
                            <label for="hotel-end">Fecha de Salida</label>
                            <input type="date" id="hotel-end" value="2026-06-27" required>
                        </div>
                    </div>
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                        <span class="dash-card-lbl">Precio estimado: <strong id="hotel-price-label">15.00€ / noche</strong></span>
                        <button type="submit" class="btn btn-primary btn-sm">Confirmar Reserva</button>
                    </div>
                </form>
            </div>
            
            <div class="panel-block">
                <h4><i class="fa-solid fa-calendar-days"></i> Reservas Activas</h4>
                <table class="panel-table">
                    <thead>
                        <tr>
                            <th>Mascota</th>
                            <th>Habitación</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookingsRows.length > 0 ? bookingsRows : '<tr><td colspan="5" style="text-align:center;">No hay reservas registradas.</td></tr>'}
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
    if (label) label.innerHTML = `${price}.00€ / noche`;
    
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
        status: 'Confirmada'
    });
    
    alert(`Reserva en el Hotel confirmada para ${petName} en la habitación ${roomName} desde el ${startDate} al ${endDate}.`);
    renderCurrentView();
};

// --- VIEW: Adoption Center ---
function renderAdoptionsView(container) {
    let adoptionsCards = AppState.adoptions.map(ad => `
        <div class="panel-block" style="margin-bottom: 20px;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin-bottom:0;"><i class="fa-solid fa-heart text-danger"></i> Mascota: ${ad.petName} (${ad.type})</h4>
                <span class="table-badge success">${ad.status}</span>
            </div>
            <p class="dash-card-lbl" style="font-size:0.9rem; margin-bottom:15px;">${ad.desc}</p>
            <div style="display:flex; justify-content: space-between; align-items: center; border-top:1px solid rgba(255,255,255,0.04); padding-top:15px;">
                <span class="dash-card-lbl">Edad aproximada: <strong>${ad.age}</strong></span>
                <div>
                    <span class="dash-card-lbl" style="margin-right:15px;">Peticiones recibidas: <strong>${ad.applicationsCount}</strong></span>
                    <button class="btn btn-primary btn-sm" onclick="applyForAdoption(${ad.id})">
                        <i class="fa-solid fa-file-signature"></i> Solicitar Adopción
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <h3 class="view-title">Centro de Adopciones</h3>
        <p class="view-subtitle">Facilita el encuentro entre mascotas abandonadas o sin hogar y nuevas familias adoptantes.</p>
        
        <div class="dashboard-details-grid">
            <div>
                <h4><i class="fa-solid fa-paw"></i> Mascotas en Adopción</h4>
                ${adoptionsCards}
            </div>
            
            <div class="panel-block" style="align-self: flex-start;">
                <h4><i class="fa-solid fa-bullhorn"></i> Publicar Mascota para Adopción</h4>
                <form onsubmit="handleAdoptionSubmit(event)">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-name">Nombre de la Mascota</label>
                        <input type="text" id="adopt-name" required placeholder="Ej. Thor">
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-type">Especie</label>
                        <select id="adopt-type">
                            <option value="Dog">Perro (Dog)</option>
                            <option value="Cat">Gato (Cat)</option>
                            <option value="Rabbit">Conejo (Rabbit)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="adopt-age">Edad aproximada</label>
                        <input type="text" id="adopt-age" placeholder="Ej. 6 meses" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="adopt-desc">Descripción / Historia</label>
                        <textarea id="adopt-desc" rows="3" placeholder="Información sobre su carácter, estado de salud..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-plus"></i> Publicar en el Catálogo
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
        alert(`Tu solicitud de adopción para "${item.petName}" ha sido enviada con éxito al propietario de la clínica. Evaluaremos tu perfil.`);
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
        status: 'Disponible',
        applicationsCount: 0
    });
    
    alert(`La mascota "${petName}" se ha listado exitosamente en el catálogo público de adopciones.`);
    renderCurrentView();
};

// --- VIEW: ITSM / SLA Monitor ---
function renderItsmView(container) {
    let ticketsRows = AppState.tickets.map(t => {
        let statusBadgeClass = t.slaStatus === 'DENTRO' ? 'success' : 'danger';
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
                    <span>TTO (Asignación): <strong>${t.tto}</strong></span>
                    <span>TTR (Resolución): <strong>${t.ttr}</strong></span>
                    <span>SLA Estado: <span class="table-badge ${statusBadgeClass}">${t.slaStatus} SLA</span></span>
                </div>
                ${t.status === 'Abierto' ? `
                    <div class="ticket-actions">
                        <button class="btn btn-primary btn-sm" onclick="resolveTicket('${t.id}')">
                            <i class="fa-solid fa-check"></i> Resolver Ticket
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <h3 class="view-title">SLA & Ticket Monitor (iTop ITSM Integration)</h3>
        <p class="view-subtitle">Simulación de la gestión de incidencias del Customer Agreement con tiempos de respuesta (TTO) y resolución (TTR).</p>
        
        <div class="itsm-dashboard">
            <div class="panel-block itsm-ticket-form">
                <h4><i class="fa-solid fa-bug-slash"></i> Registrar Nueva Incidencia / Solicitud</h4>
                <form onsubmit="handleTicketSubmit(event)">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label for="t-title">Título del Ticket / Fallo</label>
                        <input type="text" id="t-title" required placeholder="Ej. Error 500 al guardar visitas">
                    </div>
                    <div class="form-grid" style="margin-bottom:12px;">
                        <div class="form-group">
                            <label for="t-type">Tipo</label>
                            <select id="t-type">
                                <option value="Incidencia">Incidencia (Fallo)</option>
                                <option value="Petición">Petición de Servicio</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="t-plan">Plan Cliente</label>
                            <select id="t-plan">
                                <option value="platinum">Platinum (Prioritario)</option>
                                <option value="gold">Gold (Estándar)</option>
                                <option value="basic">Basic (Sin SLA)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-grid" style="margin-bottom:15px;">
                        <div class="form-group">
                            <label for="t-impact">Impacto al Negocio</label>
                            <select id="t-impact">
                                <option value="High">Alto (Servicio Caído)</option>
                                <option value="Medium">Medio (Módulo fallando)</option>
                                <option value="Low">Bajo (Fallo cosmético)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="t-urgency">Urgencia Operativa</label>
                            <select id="t-urgency">
                                <option value="High">Alta (Necesita arreglo inmediato)</option>
                                <option value="Medium">Media (Operativo temporal)</option>
                                <option value="Low">Baja (Sin prisa)</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-paper-plane"></i> Crear Ticket iTop
                    </button>
                </form>
                
                <div class="priority-matrix-info">
                    <strong>Matriz de Prioridad ITSM (Calculada):</strong><br>
                    - Impacto Alto + Urgencia Alta = <strong>P1 (Crítica)</strong><br>
                    - Impacto Medio + Urgencia Media/Baja = <strong>P3 (Estándar)</strong>
                </div>
            </div>
            
            <div class="itsm-tickets-panel">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <h4><i class="fa-solid fa-list-check"></i> Cola de Tickets iTop</h4>
                    <span class="dash-card-lbl">SLA Global: <strong class="text-success">${AppState.slaStats.slaCompliance}%</strong></span>
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
    let limitTto = '2 días';
    let limitTtr = '5 días';
    if (plan === 'platinum') {
        if (priority === 'P1') { limitTto = '12 horas'; limitTtr = '2 días'; }
        else if (priority === 'P2') { limitTto = '24 horas'; limitTtr = '4 días'; }
        else { limitTto = '2 días'; limitTtr = '6 días'; }
    } else if (plan === 'gold') {
        if (priority === 'P1') { limitTto = '2 días'; limitTtr = '4 días'; }
        else if (priority === 'P2') { limitTto = '3 días'; limitTtr = '5 días'; }
        else { limitTto = '4 días'; limitTtr = '7 días'; }
    } else {
        limitTto = 'Sin SLA';
        limitTtr = 'Sin SLA';
    }
    
    const prefix = type === 'Incidencia' ? 'I-' : 'R-';
    const newId = prefix + '00' + (1427 + AppState.tickets.length);
    
    AppState.tickets.push({
        id: newId,
        title,
        type,
        priority,
        status: 'Abierto',
        tto: `En progreso (Límite: ${limitTto})`,
        ttr: `En progreso (Límite: ${limitTtr})`,
        slaStatus: 'DENTRO',
        plan,
        limitTtrVal: limitTtr
    });
    
    AppState.slaStats.totalTickets += 1;
    
    alert(`Ticket ${newId} registrado con prioridad ${priority}. El temporizador de SLA ha comenzado.`);
    renderCurrentView();
};

window.resolveTicket = function(ticketId) {
    const ticket = AppState.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Simulate resolution time
    // We let the user simulate whether it resolved on-time or delayed to show ITSM SLA calculations
    const onTime = confirm(`¿Quieres simular que el ticket ${ticketId} se resolvió DENTRO del plazo de SLA? (Si pulsas Cancelar, se simulará un retraso para ver la compensación en la cuota)`);
    
    ticket.status = 'Resuelto';
    
    if (onTime) {
        ticket.tto = '1 hora (SLA Cumplido)';
        ticket.ttr = '12 horas (SLA Cumplido)';
        ticket.slaStatus = 'DENTRO';
    } else {
        ticket.tto = '12 horas (SLA Incumplido)';
        ticket.ttr = '10 días (SLA Incumplido)';
        ticket.slaStatus = 'FUERA';
    }
    
    // Recalculate stats
    const total = AppState.tickets.length;
    const resolved = AppState.tickets.filter(t => t.status === 'Resuelto');
    const withinSla = resolved.filter(t => t.slaStatus === 'DENTRO').length;
    
    AppState.slaStats.resolvedTickets = resolved.length;
    AppState.slaStats.slaCompliance = Math.round((withinSla / resolved.length) * 100);
    
    if (AppState.slaStats.slaCompliance < 100) {
        AppState.slaStats.activeDiscount = '10% de descuento en la siguiente factura de la clínica por incumplimiento de SLA (TTR > 30% del umbral)';
    } else {
        AppState.slaStats.activeDiscount = 'Ninguno (100% SLA cumplido)';
    }
    
    alert(`Ticket ${ticketId} marcado como Resuelto. Estado de SLA: ${ticket.slaStatus}. Descuento activo: ${AppState.slaStats.activeDiscount}`);
    renderCurrentView();
};
