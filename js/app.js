/* ==========================================================================
   App - Controlador Principal Vanilla JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.roleStore;
  const scheduler = window.roleScheduler;

  // Estado de Navegación de Fecha
  let currentMonday = scheduler.getMonday(new Date());
  let maintMonday = scheduler.getMonday(new Date());

  // Elementos DOM Principales
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const toastContainer = document.getElementById('toast-container');

  // Stats Header
  const statTotalPeople = document.getElementById('stat-total-people');
  const statEligiblePeople = document.getElementById('stat-eligible-people');
  const statTotalHistory = document.getElementById('stat-total-history');

  // Vista Cronograma General
  const weekDisplayRange = document.getElementById('week-display-range');
  const scheduleGrid = document.getElementById('schedule-grid');
  const btnPrevWeek = document.getElementById('btn-prev-week');
  const btnNextWeek = document.getElementById('btn-next-week');
  const btnCurrentWeek = document.getElementById('btn-current-week');
  const btnAutoGenerate = document.getElementById('btn-auto-generate');

  // Vista Cronograma Mantenimiento
  const maintWeekDisplayRange = document.getElementById('maint-week-display-range');
  const maintScheduleGrid = document.getElementById('maint-schedule-grid');
  const btnMaintPrevWeek = document.getElementById('btn-maint-prev-week');
  const btnMaintNextWeek = document.getElementById('btn-maint-next-week');
  const btnMaintCurrentWeek = document.getElementById('btn-maint-current-week');
  const btnMaintAutoGenerate = document.getElementById('btn-maint-auto-generate');

  // Vista Personal
  const personnelGrid = document.getElementById('personnel-grid');
  const btnOpenAddPerson = document.getElementById('btn-open-add-person');

  // Vista Historial
  const historyTableBody = document.getElementById('history-table-body');
  const historySearchInput = document.getElementById('history-search');

  // Vista JSON
  const btnExportJson = document.getElementById('btn-export-json');
  const jsonFileInput = document.getElementById('json-file-input');
  const btnImportJson = document.getElementById('btn-import-json');

  // Modales
  const personModal = document.getElementById('person-modal');
  const personForm = document.getElementById('person-form');
  const personIdInput = document.getElementById('person-id-input');
  const personNameInput = document.getElementById('person-name-input');
  const personCargoInput = document.getElementById('person-cargo-input');
  const personModalTitle = document.getElementById('person-modal-title');

  const assignModal = document.getElementById('assign-modal');
  const assignForm = document.getElementById('assign-form');
  const assignDateInput = document.getElementById('assign-date-input');
  const assignDayNameInput = document.getElementById('assign-dayname-input');
  const assignDateDisplay = document.getElementById('assign-date-display');
  const selectParque = document.getElementById('select-parque');
  const selectOf = document.getElementById('select-of');
  const btnSaveToHistory = document.getElementById('btn-save-to-history');

  // Modal Mantenimiento Manual
  const maintAssignModal = document.getElementById('maint-assign-modal');
  const maintAssignForm = document.getElementById('maint-assign-form');
  const maintAssignDateInput = document.getElementById('maint-assign-date-input');
  const maintAssignDayNameInput = document.getElementById('maint-assign-dayname-input');
  const maintAssignDateDisplay = document.getElementById('maint-assign-date-display');
  const maintRolesFormContainer = document.getElementById('maint-roles-form-container');

  // Modal Rango Fechas General
  const daterangeModal = document.getElementById('daterange-modal');
  const daterangeForm = document.getElementById('daterange-form');
  const daterangeStart = document.getElementById('daterange-start');
  const daterangeEnd = document.getElementById('daterange-end');
  const daterangeInfo = document.getElementById('daterange-info');
  const daterangeInfoText = document.getElementById('daterange-info-text');

  let currentViewDays = null;

  // TOAST NOTIFICATIONS
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    if (type === 'danger') iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    if (type === 'warning') iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    toast.innerHTML = `<span style="display:flex;flex-shrink:0;">${iconSvg}</span><div>${message}</div>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // TABS NAVIGATION
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) targetContent.classList.add('active');

      if (targetTab === 'tab-history') renderHistoryTable();
      if (targetTab === 'tab-personnel') renderPersonnelGrid();
      if (targetTab === 'tab-schedule') renderScheduleView();
      if (targetTab === 'tab-maint-schedule') renderMaintScheduleView();
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    });
  });

  function updateHeaderStats() {
    const people = store.getPeople();
    const eligible = store.getEligiblePeople();
    const history = store.getHistory();

    statTotalPeople.textContent = people.length;
    statEligiblePeople.textContent = eligible.length;
    statTotalHistory.textContent = history.length;
  }

  function getRoleDisplayText(personId, isWorking) {
    if (!isWorking) return 'No aplica';
    if (personId === 'null') return 'Ninguno (Nulo)';
    if (!personId) return 'Sin asignar';
    const p = store.getPersonById(personId);
    return p ? p.name : 'Sin asignar';
  }

  // VISTA 1: CRONOGRAMA SEMANAL GENERAL
  function renderScheduleView() {
    const weekDays = currentViewDays || scheduler.getWeekDates(currentMonday);
    const startDateStr = weekDays[0].formatted;
    const endDateStr = weekDays[weekDays.length - 1].formatted;

    weekDisplayRange.textContent = `${startDateStr} — ${endDateStr}`;
    scheduleGrid.innerHTML = '';

    weekDays.forEach(dayObj => {
      const isWorking = scheduler.isWorkingDay(dayObj.dateStr);
      const statusText = scheduler.getDayStatusText(dayObj.dateStr);

      const card = document.createElement('div');
      card.className = `day-card ${dayObj.isToday ? 'today' : ''} ${!isWorking ? 'locked' : ''}`;

      const savedSchedule = store.getScheduleForDate(dayObj.dateStr);
      const parquePersonId = savedSchedule ? savedSchedule.parquePersonId : null;
      const ofPersonId = savedSchedule ? savedSchedule.ofPersonId : null;

      const isHistorySaved = store.getHistory().some(h => h.date === dayObj.dateStr);

      const svgCheck = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>`;
      const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      const svgCancel = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

      card.innerHTML = `
        <div class="day-card-header">
          <div class="day-name">${dayObj.dayName} ${isHistorySaved ? `<span style="font-size:0.72rem; color:var(--success); font-weight:600; display:inline-flex; align-items:center; gap:3px; vertical-align:middle;">${svgCheck} En Historial</span>` : ''}</div>
          <div class="day-date">${scheduler.formatReadableDate(dayObj.dateStr)}</div>
        </div>

        <div class="roles-list">
          <div class="role-box parque">
            <div class="role-info">
              <span class="role-badge parque">Parque</span>
              <span class="assigned-person ${!isWorking || !parquePersonId || parquePersonId === 'null' ? 'unassigned' : ''}">
                ${getRoleDisplayText(parquePersonId, isWorking)}
              </span>
            </div>
          </div>

          <div class="role-box of">
            <div class="role-info">
              <span class="role-badge of">OF de Día</span>
              <span class="assigned-person ${!isWorking || !ofPersonId || ofPersonId === 'null' ? 'unassigned' : ''}">
                ${getRoleDisplayText(ofPersonId, isWorking)}
              </span>
            </div>
          </div>
        </div>

        <div class="day-card-actions" style="display:flex; gap:8px;">
          ${isWorking ? `
            <button class="btn btn-secondary btn-sm btn-assign-day" data-date="${dayObj.dateStr}" data-dayname="${dayObj.dayName}" style="flex:1;">
              ${svgEdit} ${savedSchedule ? 'Editar Rol' : 'Asignar Rol'}
            </button>
            <button class="btn btn-danger btn-sm btn-cancel-day" data-date="${dayObj.dateStr}" title="Anular asignaciones de este día">
              ${svgCancel} Anular
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" disabled style="flex:1; cursor: not-allowed; background: var(--gray-light); border-color: var(--gray-light); color: var(--text-muted); opacity:0.6; display:flex; align-items:center; justify-content:center; gap:5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ${statusText || 'No Laborable'}
            </button>
          `}
        </div>
      `;

      scheduleGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-assign-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.getAttribute('data-date');
        const dayName = btn.getAttribute('data-dayname');
        openAssignModal(dateStr, dayName);
      });
    });

    document.querySelectorAll('.btn-cancel-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.getAttribute('data-date');
        if (confirm(`¿Estás seguro de anular las asignaciones para el día ${scheduler.formatReadableDate(dateStr)}?`)) {
          store.setScheduleForDate(dateStr, null, null);
          renderScheduleView();
          renderPersonnelGrid();
          showToast(`Asignaciones anuladas para el ${scheduler.formatReadableDate(dateStr)}.`, 'warning');
        }
      });
    });

    updateHeaderStats();
  }

  // VISTA 1.5: CRONOGRAMA DE MANTENIMIENTO
  function renderMaintScheduleView() {
    const weekDays = scheduler.getWeekDates(maintMonday);
    const startDateStr = weekDays[0].formatted;
    const endDateStr = weekDays[weekDays.length - 1].formatted;

    maintWeekDisplayRange.textContent = `${startDateStr} — ${endDateStr}`;
    maintScheduleGrid.innerHTML = '';

    weekDays.forEach(dayObj => {
      const isWorking = scheduler.isWorkingDay(dayObj.dateStr);
      const statusText = scheduler.getDayStatusText(dayObj.dateStr);

      const card = document.createElement('div');
      card.className = `day-card ${dayObj.isToday ? 'today' : ''} ${!isWorking ? 'locked' : ''}`;

      const savedMaint = store.getMaintScheduleForDate(dayObj.dateStr);

      const renderMaintPersonsList = (personIdsArray) => {
        if (!personIdsArray || personIdsArray.length === 0) return '<span class="unassigned">Sin asignar</span>';
        return personIdsArray.map(id => {
          if (id === 'null') return '<span class="unassigned">Nulo</span>';
          const p = store.getPersonById(id);
          return p ? `<strong>${p.name}</strong>` : '<span class="unassigned">Sin asignar</span>';
        }).join(', ');
      };

      const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      const svgCancel = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

      card.innerHTML = `
        <div class="day-card-header">
          <div class="day-name">${dayObj.dayName}</div>
          <div class="day-date">${scheduler.formatReadableDate(dayObj.dateStr)}</div>
        </div>

        <div class="roles-list" style="font-size:0.82rem; display:flex; flex-direction:column; gap:6px;">
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Frente:</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.frente : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Sala:</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.sala : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Cocina (1):</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.cocina : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Oficina (1):</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.oficina : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">360 (1):</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.p360 : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Ventanas:</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.ventanas : null)}</div>
          </div>
          <div style="background:var(--bg-surface-2); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            <strong style="color:var(--primary);">Fregadero:</strong> 
            <div>${renderMaintPersonsList(savedMaint ? savedMaint.fregadero : null)}</div>
          </div>
        </div>

        <div class="day-card-actions" style="display:flex; gap:8px; margin-top:10px;">
          ${isWorking ? `
            <button class="btn btn-secondary btn-sm btn-assign-maint-day" data-date="${dayObj.dateStr}" data-dayname="${dayObj.dayName}" style="flex:1;">
              ${svgEdit} ${savedMaint ? 'Editar Mantenimiento' : 'Asignar Roles'}
            </button>
            <button class="btn btn-danger btn-sm btn-cancel-maint-day" data-date="${dayObj.dateStr}" title="Anular Mantenimiento">
              ${svgCancel}
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" disabled style="flex:1; cursor: not-allowed; background: var(--gray-light); border-color: var(--gray-light); color: var(--text-muted); opacity:0.6;">
              ${statusText || 'No Laborable'}
            </button>
          `}
        </div>
      `;

      maintScheduleGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-assign-maint-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.getAttribute('data-date');
        const dayName = btn.getAttribute('data-dayname');
        openMaintAssignModal(dateStr, dayName);
      });
    });

    document.querySelectorAll('.btn-cancel-maint-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.getAttribute('data-date');
        if (confirm(`¿Anular roles de mantenimiento para el día ${scheduler.formatReadableDate(dateStr)}?`)) {
          store.setMaintScheduleForDate(dateStr, null);
          renderMaintScheduleView();
          showToast(`Roles de mantenimiento anulados.`, 'warning');
        }
      });
    });
  }

  // Navegación Mantenimiento
  btnMaintPrevWeek.addEventListener('click', () => {
    maintMonday = new Date(maintMonday);
    maintMonday.setDate(maintMonday.getDate() - 7);
    renderMaintScheduleView();
  });

  btnMaintNextWeek.addEventListener('click', () => {
    maintMonday = new Date(maintMonday);
    maintMonday.setDate(maintMonday.getDate() + 7);
    renderMaintScheduleView();
  });

  btnMaintCurrentWeek.addEventListener('click', () => {
    maintMonday = scheduler.getMonday(new Date());
    renderMaintScheduleView();
  });

  // BOTÓN GENERAR MANTENIMIENTO AUTOMÁTICO - MODAL ESTILIZADO
  btnMaintAutoGenerate.addEventListener('click', () => {
    const weekDays = scheduler.getWeekDates(maintMonday);
    const allPeople = store.getPeople();

    if (allPeople.length === 0) {
      showToast('No hay personal registrado para generar el mantenimiento.', 'warning');
      return;
    }

    openFixedPersonModal(weekDays);
  });

  // Modal Dedicado de Asignación Fija
  function openFixedPersonModal(weekDays) {
    const allPeople = store.getPeople();
    const existingModal = document.getElementById('fixed-person-modal');
    if (existingModal) existingModal.remove();

    const maintRolesOptions = [
      { id: 'frente', name: 'Frente' },
      { id: 'sala', name: 'Sala' },
      { id: 'cocina', name: 'Cocina' },
      { id: 'oficina', name: 'Oficina' },
      { id: 'p360', name: '360' },
      { id: 'ventanas', name: 'Ventanas' },
      { id: 'fregadero', name: 'Fregadero' }
    ];

    let personSelectHTML = `<option value="">-- Seleccionar Persona --</option>`;
    allPeople.forEach(p => {
      personSelectHTML += `<option value="${p.id}">${p.name} (${p.cargo})</option>`;
    });

    let roleSelectHTML = `<option value="">-- Seleccionar Posición --</option>`;
    maintRolesOptions.forEach(r => {
      roleSelectHTML += `<option value="${r.id}">${r.name}</option>`;
    });

    const modalHTML = `
      <div id="fixed-person-modal">
        <div class="modal-fixed-content">
          <div class="modal-fixed-header">
            <h3>Generar Mantenimiento Automático</h3>
            <button class="modal-fixed-close" id="close-fixed-modal">&times;</button>
          </div>
          <form id="fixed-person-form">
            <div class="modal-fixed-body">
              <p class="modal-fixed-desc">
                ¿Deseas fijar a alguien toda la semana en una posición específica? Selecciona la persona y su puesto correspondiente.
              </p>
              <div class="form-group">
                <label class="form-label">Persona Fija (Opcional)</label>
                <select id="select-fixed-person" class="form-select">
                  ${personSelectHTML}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Posición de Mantenimiento</label>
                <select id="select-fixed-role" class="form-select">
                  ${roleSelectHTML}
                </select>
              </div>
            </div>
            <div class="modal-fixed-footer">
              <button type="button" class="btn btn-secondary" id="btn-no-fixed">Generar Sin Persona Fija</button>
              <button type="submit" class="btn btn-primary">Generar Con Puesto Fijo</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('fixed-person-modal');
    const form = document.getElementById('fixed-person-form');
    const closeBtn = document.getElementById('close-fixed-modal');
    const noFixedBtn = document.getElementById('btn-no-fixed');

    setTimeout(() => modal.classList.add('active'), 10);

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 250);
    };

    closeBtn.addEventListener('click', closeModal);

    // Generar sin persona fija
    noFixedBtn.addEventListener('click', () => {
      scheduler.generateAutoMaintScheduleForWeek(weekDays, null, null);
      closeModal();
      renderMaintScheduleView();
      showToast('Mantenimiento semanal generado automáticamente sin puestos fijos.');
    });

    // Generar con persona fija
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const personId = document.getElementById('select-fixed-person').value;
      const roleKey = document.getElementById('select-fixed-role').value;

      if (!personId || !roleKey) {
        showToast('Debes seleccionar tanto la persona como la posición para asignar un puesto fijo.', 'warning');
        return;
      }

      const pObj = store.getPersonById(personId);
      scheduler.generateAutoMaintScheduleForWeek(weekDays, personId, roleKey);
      closeModal();
      renderMaintScheduleView();
      showToast(`Mantenimiento generado. ${pObj ? pObj.name : 'Persona'} quedó fijo/a en ${roleKey.toUpperCase()} toda la semana.`);
    });
  }

  // ABRIR MODAL MANTENIMIENTO MANUAL
  function openMaintAssignModal(dateStr, dayName) {
    maintAssignDateInput.value = dateStr;
    maintAssignDayNameInput.value = dayName;
    maintAssignDateDisplay.textContent = `${dayName}, ${scheduler.formatReadableDate(dateStr)}`;

    const allPeople = store.getPeople();
    const currentMaint = store.getMaintScheduleForDate(dateStr) || {};

    maintRolesFormContainer.innerHTML = '';

    const roleDefinitions = [
      { id: 'frente', name: 'Frente', defaultCount: 3, isFlexible: true },
      { id: 'sala', name: 'Sala', defaultCount: 2, isFlexible: true },
      { id: 'cocina', name: 'Cocina', defaultCount: 1, isFlexible: false },
      { id: 'oficina', name: 'Oficina', defaultCount: 1, isFlexible: false },
      { id: 'p360', name: '360', defaultCount: 1, isFlexible: false },
      { id: 'ventanas', name: 'Ventanas', defaultCount: 2, isFlexible: true },
      { id: 'fregadero', name: 'Fregadero', defaultCount: 2, isFlexible: true }
    ];

    roleDefinitions.forEach(roleDef => {
      const existingArray = currentMaint[roleDef.id] || [];
      const count = Math.max(roleDef.defaultCount, existingArray.length);

      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'form-group';
      fieldGroup.style.background = 'var(--bg-surface-2)';
      fieldGroup.style.padding = '12px';
      fieldGroup.style.borderRadius = 'var(--radius-sm)';

      let selectOptionsHTML = `<option value="">-- Sin Asignar --</option><option value="null">-- Nulo --</option>`;
      allPeople.forEach(p => {
        selectOptionsHTML += `<option value="${p.id}">${p.name} (${p.canAssign ? 'Apto' : 'No Apto'})</option>`;
      });

      let selectsHTML = '';
      for (let i = 0; i < count; i++) {
        selectsHTML += `
          <select name="maint_${roleDef.id}_${i}" class="form-select maint-select" style="margin-bottom:6px;">
            ${selectOptionsHTML}
          </select>
        `;
      }

      fieldGroup.innerHTML = `
        <label class="form-label" style="font-weight:700; color:var(--primary);">
          ${roleDef.name} ${roleDef.isFlexible ? '(Flexible)' : '(1 Persona)'}
        </label>
        ${selectsHTML}
      `;

      maintRolesFormContainer.appendChild(fieldGroup);

      for (let i = 0; i < count; i++) {
        const sel = fieldGroup.querySelector(`[name="maint_${roleDef.id}_${i}"]`);
        if (sel && existingArray[i]) {
          sel.value = existingArray[i];
        }
      }
    });

    maintAssignModal.classList.add('active');
  }

  // Guardar Mantenimiento Manual
  maintAssignForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateStr = maintAssignDateInput.value;

    const roleKeys = ['frente', 'sala', 'cocina', 'oficina', 'p360', 'ventanas', 'fregadero'];
    const newMaintData = {};

    roleKeys.forEach(roleKey => {
      newMaintData[roleKey] = [];
      const selects = maintRolesFormContainer.querySelectorAll(`[name^="maint_${roleKey}_"]`);
      selects.forEach(s => {
        if (s.value) {
          newMaintData[roleKey].push(s.value);
        }
      });
    });

    store.setMaintScheduleForDate(dateStr, newMaintData);
    maintAssignModal.classList.remove('active');
    renderMaintScheduleView();
    showToast('Asignación de mantenimiento actualizada.');
  });

  // NAVEGACIÓN Y ACCIONES DEL CRONOGRAMA GENERAL
  btnPrevWeek.addEventListener('click', () => {
    currentViewDays = null;
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() - 7);
    renderScheduleView();
  });

  btnNextWeek.addEventListener('click', () => {
    currentViewDays = null;
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
    renderScheduleView();
  });

  btnCurrentWeek.addEventListener('click', () => {
    currentViewDays = null;
    currentMonday = scheduler.getMonday(new Date());
    renderScheduleView();
  });

  btnAutoGenerate.addEventListener('click', () => {
    const weekDays = scheduler.getWeekDates(currentMonday);
    daterangeStart.value = weekDays[0].dateStr;
    daterangeEnd.value = weekDays[6].dateStr;
    updateDaterangeInfo();
    daterangeModal.classList.add('active');
  });

  function updateDaterangeInfo() {
    const start = daterangeStart.value;
    const end = daterangeEnd.value;
    if (start && end) {
      const days = scheduler.getDatesInRange(start, end);
      if (days.length === 0) {
        daterangeInfo.style.display = 'block';
        daterangeInfoText.style.color = 'var(--danger)';
        daterangeInfoText.textContent = 'La fecha de fin debe ser igual o posterior a la de inicio.';
      } else {
        daterangeInfo.style.display = 'block';
        daterangeInfoText.style.color = 'var(--success)';
        daterangeInfoText.textContent = `Se generarán asignaciones para ${days.length} día${days.length !== 1 ? 's' : ''}.`;
      }
    } else {
      daterangeInfo.style.display = 'none';
    }
  }

  daterangeStart.addEventListener('change', updateDaterangeInfo);
  daterangeEnd.addEventListener('change', updateDaterangeInfo);

  daterangeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const start = daterangeStart.value;
    const end = daterangeEnd.value;

    if (!start || !end) {
      showToast('Debes seleccionar ambas fechas.', 'warning');
      return;
    }

    const days = scheduler.getDatesInRange(start, end);
    if (days.length === 0) {
      showToast('La fecha de fin debe ser posterior o igual a la de inicio.', 'danger');
      return;
    }

    try {
      scheduler.generateAutoScheduleForWeek(days);
      currentViewDays = days;
      currentMonday = scheduler.getMonday(new Date(start.replace(/-/g, '/')));
      daterangeModal.classList.remove('active');
      renderScheduleView();
      showToast(`Cronograma generado para ${days.length} día${days.length !== 1 ? 's' : ''}.`);
    } catch (err) {
      showToast(err.message, 'warning');
    }
  });

  function openAssignModal(dateStr, dayName) {
    assignDateInput.value = dateStr;
    assignDayNameInput.value = dayName;
    assignDateDisplay.textContent = `${dayName}, ${scheduler.formatReadableDate(dateStr)}`;

    const eligiblePeople = store.getEligiblePeople();
    const currentSchedule = store.getScheduleForDate(dateStr);

    selectParque.innerHTML = `
      <option value="">-- Seleccionar Persona para Parque --</option>
      <option value="null">-- Ninguno / Rol Nulo --</option>
    `;
    selectOf.innerHTML = `
      <option value="">-- Seleccionar Persona para OF de Día --</option>
      <option value="null">-- Ninguno / Rol Nulo --</option>
    `;

    eligiblePeople.forEach(person => {
      const optParque = document.createElement('option');
      optParque.value = person.id;
      optParque.textContent = `${person.name} (${person.cargo})`;
      if (currentSchedule && currentSchedule.parquePersonId === person.id) {
        optParque.selected = true;
      }
      selectParque.appendChild(optParque);

      const optOf = document.createElement('option');
      optOf.value = person.id;
      optOf.textContent = `${person.name} (${person.cargo})`;
      if (currentSchedule && currentSchedule.ofPersonId === person.id) {
        optOf.selected = true;
      }
      selectOf.appendChild(optOf);
    });

    if (currentSchedule && currentSchedule.parquePersonId === 'null') {
      selectParque.value = 'null';
    }
    if (currentSchedule && currentSchedule.ofPersonId === 'null') {
      selectOf.value = 'null';
    }

    assignModal.classList.add('active');
  }

  assignForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateStr = assignDateInput.value;
    const parqueId = selectParque.value;
    const ofId = selectOf.value;

    const validation = scheduler.validateAssignment(parqueId, ofId);
    if (!validation.valid) {
      showToast(validation.message, 'danger');
      return;
    }

    store.setScheduleForDate(dateStr, parqueId || null, ofId || null);
    assignModal.classList.remove('active');
    renderScheduleView();
    renderPersonnelGrid();
    showToast('Asignación diaria guardada con éxito.');
  });

  btnSaveToHistory.addEventListener('click', () => {
    const dateStr = assignDateInput.value;
    const dayName = assignDayNameInput.value;
    const parqueId = selectParque.value;
    const ofId = selectOf.value;

    const validation = scheduler.validateAssignment(parqueId, ofId);
    if (!validation.valid) {
      showToast(validation.message, 'danger');
      return;
    }

    try {
      store.saveDayToHistory(dateStr, parqueId || null, ofId || null, dayName);
      assignModal.classList.remove('active');
      renderScheduleView();
      renderPersonnelGrid();
      renderHistoryTable();
      showToast('¡Asignación registrada en el historial!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // VISTA 2: GESTIÓN DE PERSONAL
  function renderPersonnelGrid() {
    const people = store.getPeople();
    personnelGrid.innerHTML = '';

    if (people.length === 0) {
      personnelGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          No hay personas registradas. Presiona <strong>"+ Agregar Persona"</strong> para comenzar.
        </div>
      `;
      return;
    }

    people.forEach(person => {
      const card = document.createElement('div');
      card.className = 'person-card';

      const initial = person.name.charAt(0).toUpperCase();

      card.innerHTML = `
        <div class="person-card-header">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="person-avatar">${initial}</div>
            <div>
              <div class="person-name">${person.name}</div>
              <div class="person-rank">${person.cargo}</div>
            </div>
          </div>
        </div>

        <div>
          <span class="status-badge ${person.canAssign ? 'eligible' : 'restricted'}">
            ${person.canAssign
          ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Habilitado`
          : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> No puede (Sólo Maint.)`
        }
          </span>
        </div>

        <div class="person-stats">
          <div>
            <div class="p-stat-val">${person.countParque || 0}</div>
            <div class="p-stat-lbl">Parque</div>
          </div>
          <div>
            <div class="p-stat-val">${person.countOF || 0}</div>
            <div class="p-stat-lbl">OF de Día</div>
          </div>
        </div>

        <div class="person-actions">
          <button class="btn btn-secondary btn-sm btn-toggle-status" data-id="${person.id}">
            ${person.canAssign ? 'Cambiar a Exento' : 'Habilitar'}
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-person" data-id="${person.id}" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-delete-person" data-id="${person.id}" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      `;

      personnelGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const newStatus = store.togglePersonStatus(id);
        renderPersonnelGrid();
        renderScheduleView();
        showToast(`Aptitud actualizada a: ${newStatus ? 'Habilitado' : 'Exento'}`);
      });
    });

    document.querySelectorAll('.btn-edit-person').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditPersonModal(id);
      });
    });

    document.querySelectorAll('.btn-delete-person').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const person = store.getPersonById(id);
        if (confirm(`¿Estás seguro de eliminar a ${person ? person.name : 'esta persona'}?`)) {
          store.deletePerson(id);
          renderPersonnelGrid();
          renderScheduleView();
          showToast('Persona eliminada correctamente.', 'warning');
        }
      });
    });

    updateHeaderStats();
  }

  btnOpenAddPerson.addEventListener('click', () => {
    personForm.reset();
    personIdInput.value = '';
    personModalTitle.textContent = 'Agregar Nueva Persona';
    document.querySelector('input[name="person-can-assign"][value="true"]').checked = true;
    personModal.classList.add('active');
  });

  function openEditPersonModal(id) {
    const person = store.getPersonById(id);
    if (!person) return;

    personIdInput.value = person.id;
    personNameInput.value = person.name;
    personCargoInput.value = person.cargo;
    personModalTitle.textContent = 'Editar Persona';

    const canAssignRadio = document.querySelector(`input[name="person-can-assign"][value="${person.canAssign}"]`);
    if (canAssignRadio) canAssignRadio.checked = true;

    personModal.classList.add('active');
  }

  personForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = personIdInput.value;
    const name = personNameInput.value;
    const cargo = personCargoInput.value;
    const canAssign = document.querySelector('input[name="person-can-assign"]:checked').value === 'true';

    if (id) {
      store.updatePerson(id, name, cargo, canAssign);
      showToast('Persona actualizada con éxito.');
    } else {
      store.addPerson(name, cargo, canAssign);
      showToast('Nueva persona registrada exitosamente.');
    }

    personModal.classList.remove('active');
    renderPersonnelGrid();
    renderScheduleView();
  });

  // VISTA 3: HISTORIAL DE ROLES
  function renderHistoryTable(query = '') {
    const history = store.getHistory();
    historyTableBody.innerHTML = '';

    const filtered = history.filter(item => {
      const q = query.toLowerCase();
      return (item.parquePersonName && item.parquePersonName.toLowerCase().includes(q)) ||
        (item.ofPersonName && item.ofPersonName.toLowerCase().includes(q)) ||
        item.date.includes(q) ||
        (item.dayName && item.dayName.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
            ${query ? 'No se encontraron registros que coincidan con la búsqueda.' : 'Aún no hay historial guardado.'}
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      const dateReadable = scheduler.formatReadableDate(item.date);
      const registeredAt = new Date(item.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

      tr.innerHTML = `
        <td>
          <strong>${item.dayName ? item.dayName + ', ' : ''}</strong>
          <span style="color: var(--text-muted); font-size: 0.85rem;">${dateReadable}</span>
        </td>
        <td>
          <span class="role-badge parque" style="margin-right: 6px;">Parque</span>
          <strong>${item.parquePersonName || 'Ninguno (Nulo)'}</strong>
        </td>
        <td>
          <span class="role-badge of" style="margin-right: 6px;">OF de Día</span>
          <strong>${item.ofPersonName || 'Ninguno (Nulo)'}</strong>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${registeredAt}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger btn-sm btn-delete-history" data-id="${item.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Borrar
          </button>
        </td>
      `;

      historyTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Deseas eliminar este registro del historial?')) {
          store.deleteHistoryEntry(id);
          renderHistoryTable(historySearchInput.value);
          renderScheduleView();
          renderPersonnelGrid();
          showToast('Registro eliminado del historial.', 'warning');
        }
      });
    });

    updateHeaderStats();
  }

  historySearchInput.addEventListener('input', (e) => {
    renderHistoryTable(e.target.value);
  });

  // VISTA 4: RESPALDOS JSON
  btnExportJson.addEventListener('click', () => {
    const jsonStr = store.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_mantenimiento_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Archivo JSON de respaldo descargado.');
  });

  btnImportJson.addEventListener('click', () => {
    const file = jsonFileInput.files[0];
    if (!file) {
      showToast('Por favor selecciona un archivo .json primero.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        store.importJSON(content);
        jsonFileInput.value = '';
        renderScheduleView();
        renderMaintScheduleView();
        renderPersonnelGrid();
        renderHistoryTable();
        showToast('¡Base de datos JSON restaurada con éxito!');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
    reader.readAsText(file);
  });

  // INICIALIZACIÓN DE LA APLICACIÓN
  renderScheduleView();
  renderMaintScheduleView();
  renderPersonnelGrid();
  renderHistoryTable();
  updateHeaderStats();
});