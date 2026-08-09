/* ==========================================================================
   Store - Gestión de Estado Local y Almacenamiento (localStorage)
   ========================================================================== */

const STORAGE_KEYS = {
  PEOPLE: 'app_roles_people_v2',
  SCHEDULES: 'app_roles_schedules_v2',
  HISTORY: 'app_roles_history_v2'
};

// Datos por defecto iniciales
const DEFAULT_PEOPLE = [
  { id: 'p1', name: 'Carlos Mendoza', cargo: 'Técnico Principal', canAssign: true, countParque: 0, countOF: 0 },
  { id: 'p2', name: 'Ana Gómez', cargo: 'Inspectora', canAssign: true, countParque: 0, countOF: 0 },
  { id: 'p3', name: 'Luis Fernández', cargo: 'Operador', canAssign: true, countParque: 0, countOF: 0 },
  { id: 'p4', name: 'Johnnelis (Dtgdo)', cargo: 'Personal de Apoyo', canAssign: true, countParque: 0, countOF: 0 },
  { id: 'p5', name: 'María Rodríguez', cargo: 'Supervisora', canAssign: true, countParque: 0, countOF: 0 }
];

class RoleStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PEOPLE)) {
      this.savePeople(DEFAULT_PEOPLE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      this.saveSchedules({});
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      this.saveHistory([]);
    }
    this.recalculateCountsFromHistory();
  }

  // --- MÉTODOS DE PERSONAS ---
  getPeople() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE)) || [];
    } catch (e) {
      return [];
    }
  }

  getEligiblePeople() {
    return this.getPeople().filter(p => p.canAssign);
  }

  getPersonById(id) {
    if (!id || id === 'null') return null;
    return this.getPeople().find(p => p.id === id) || null;
  }

  savePeople(people) {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
  }

  addPerson(name, cargo, canAssign = true) {
    const people = this.getPeople();
    const newPerson = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      cargo: cargo.trim() || 'Sin Especificar',
      canAssign: Boolean(canAssign),
      countParque: 0,
      countOF: 0
    };
    people.push(newPerson);
    this.savePeople(people);
    this.recalculateCountsFromHistory();
    return newPerson;
  }

  updatePerson(id, name, cargo, canAssign) {
    const people = this.getPeople();
    const idx = people.findIndex(p => p.id === id);
    if (idx !== -1) {
      people[idx].name = name.trim();
      people[idx].cargo = cargo.trim() || 'Sin Especificar';
      people[idx].canAssign = Boolean(canAssign);
      this.savePeople(people);
    }
  }

  togglePersonStatus(id) {
    const people = this.getPeople();
    const idx = people.findIndex(p => p.id === id);
    if (idx !== -1) {
      people[idx].canAssign = !people[idx].canAssign;
      this.savePeople(people);
      return people[idx].canAssign;
    }
    return false;
  }

  deletePerson(id) {
    let people = this.getPeople();
    people = people.filter(p => p.id !== id);
    this.savePeople(people);

    // Limpiar en cronograma activo si estaba asignado
    const schedules = this.getSchedules();
    let updatedSchedule = false;
    Object.keys(schedules).forEach(date => {
      if (schedules[date].parquePersonId === id) {
        schedules[date].parquePersonId = null;
        updatedSchedule = true;
      }
      if (schedules[date].ofPersonId === id) {
        schedules[date].ofPersonId = null;
        updatedSchedule = true;
      }
    });
    if (updatedSchedule) {
      this.saveSchedules(schedules);
    }
  }

  // --- MÉTODOS DE CRONOGRAMA ---
  getSchedules() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES)) || {};
    } catch (e) {
      return {};
    }
  }

  getScheduleForDate(dateStr) {
    const schedules = this.getSchedules();
    return schedules[dateStr] || null;
  }

  saveSchedules(schedules) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  setScheduleForDate(dateStr, parquePersonId, ofPersonId) {
    const schedules = this.getSchedules();
    if (!parquePersonId && !ofPersonId) {
      delete schedules[dateStr];
    } else {
      schedules[dateStr] = {
        parquePersonId: parquePersonId || null,
        ofPersonId: ofPersonId || null
      };
    }
    this.saveSchedules(schedules);
  }

  // --- MÉTODOS DE HISTORIAL ---
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    } catch (e) {
      return [];
    }
  }

  saveHistory(history) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  saveDayToHistory(dateStr, parquePersonId, ofPersonId, dayName = '') {
    // Si la opción seleccionada es la cadena "null" o está vacía, se normaliza a null
    const normParqueId = (!parquePersonId || parquePersonId === 'null') ? null : parquePersonId;
    const normOfId = (!ofPersonId || ofPersonId === 'null') ? null : ofPersonId;

    const parquePerson = normParqueId ? this.getPersonById(normParqueId) : null;
    const ofPerson = normOfId ? this.getPersonById(normOfId) : null;

    const history = this.getHistory();
    const existingIndex = history.findIndex(item => item.date === dateStr);

    const newEntry = {
      id: 'h_' + Date.now(),
      date: dateStr,
      dayName: dayName,
      parquePersonId: normParqueId,
      parquePersonName: parquePerson ? parquePerson.name : 'Ninguno (Nulo)',
      ofPersonId: normOfId,
      ofPersonName: ofPerson ? ofPerson.name : 'Ninguno (Nulo)',
      timestamp: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      history[existingIndex] = newEntry;
    } else {
      history.push(newEntry);
    }

    // Ordenar historial por fecha descendente
    history.sort((a, b) => b.date.localeCompare(a.date));
    this.saveHistory(history);

    // Recalcular cargas de trabajo (los roles nulos se ignoran internamente)
    this.recalculateCountsFromHistory();
  }

  deleteHistoryEntry(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    this.saveHistory(history);
    this.recalculateCountsFromHistory();
  }

  // Recalcular acumulado de cargas basándose en el historial activo
  recalculateCountsFromHistory() {
    const people = this.getPeople();
    const history = this.getHistory();

    people.forEach(p => {
      p.countParque = 0;
      p.countOF = 0;
    });

    history.forEach(item => {
      if (item.parquePersonId && item.parquePersonId !== 'null') {
        const p = people.find(x => x.id === item.parquePersonId);
        if (p) p.countParque = (p.countParque || 0) + 1;
      }
      if (item.ofPersonId && item.ofPersonId !== 'null') {
        const p = people.find(x => x.id === item.ofPersonId);
        if (p) p.countOF = (p.countOF || 0) + 1;
      }
    });

    this.savePeople(people);
  }

  // --- IMPORTACIÓN / EXPORTACIÓN JSON ---
  exportJSON() {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      people: this.getPeople(),
      schedules: this.getSchedules(),
      history: this.getHistory()
    };
    return JSON.stringify(data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.people || !Array.isArray(data.people)) {
        throw new Error('Formato JSON inválido: Falta la lista de personas.');
      }
      this.savePeople(data.people);
      this.saveSchedules(data.schedules || {});
      this.saveHistory(data.history || []);
      this.recalculateCountsFromHistory();
      return true;
    } catch (e) {
      throw new Error('Error al procesar el archivo JSON: ' + e.message);
    }
  }
}

window.roleStore = new RoleStore();