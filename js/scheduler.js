/* ==========================================================================
   Scheduler - Algoritmo de Generación y Gestión de Cronograma Semanal
   ========================================================================== */

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

class RoleScheduler {
  constructor(store) {
    this.store = store;
  }

  getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  formatYYYYMMDD(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatReadableDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }

  getWeekDates(mondayDate) {
    const week = [];
    const start = new Date(mondayDate);

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = this.formatYYYYMMDD(current);

      week.push({
        dateStr,
        dayName: DAY_NAMES[(current.getDay() + 6) % 7],
        formatted: `${current.getDate()} de ${current.toLocaleString('es-ES', { month: 'short' })}`,
        isToday: dateStr === this.formatYYYYMMDD(new Date())
      });
    }
    return week;
  }

  getDatesInRange(startDateStr, endDateStr) {
    const days = [];
    const [sy, sm, sd] = startDateStr.split('-').map(Number);
    const [ey, em, ed] = endDateStr.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const endDate = new Date(ey, em - 1, ed);

    if (endDate < startDate) return days;

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = this.formatYYYYMMDD(current);
      days.push({
        dateStr,
        dayName: DAY_NAMES[(current.getDay() + 6) % 7],
        formatted: `${current.getDate()} de ${current.toLocaleString('es-ES', { month: 'short' })}`,
        isToday: dateStr === this.formatYYYYMMDD(new Date())
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  validateAssignment(parqueId, ofId) {
    if (parqueId && ofId && parqueId !== 'null' && ofId !== 'null' && parqueId === ofId) {
      return { valid: false, message: '¡Atención! La misma persona no puede asumir los dos roles en el mismo día.' };
    }

    if (parqueId && parqueId !== 'null') {
      const parquePerson = this.store.getPersonById(parqueId);
      if (!parquePerson || !parquePerson.canAssign) {
        return { valid: false, message: `La persona (${parquePerson ? parquePerson.name : 'Desconocida'}) no tiene permitido asumir roles.` };
      }
    }

    if (ofId && ofId !== 'null') {
      const ofPerson = this.store.getPersonById(ofId);
      if (!ofPerson || !ofPerson.canAssign) {
        return { valid: false, message: `La persona (${ofPerson ? ofPerson.name : 'Desconocida'}) no tiene permitido asumir roles.` };
      }
    }

    return { valid: true };
  }

  isWorkingDay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (date.getDay() === 0) {
      return false;
    }

    const monday = this.getMonday(date);
    const refMonday = new Date(2026, 7, 3);
    const diffTime = monday.getTime() - refMonday.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

    const isWorkWeek = Math.abs(diffWeeks) % 2 === 1;
    return isWorkWeek;
  }

  getDayStatusText(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (date.getDay() === 0) {
      return 'Domingo - Libre';
    }

    const monday = this.getMonday(date);
    const refMonday = new Date(2026, 7, 3);
    const diffTime = monday.getTime() - refMonday.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    const isWorkWeek = Math.abs(diffWeeks) % 2 === 1;

    if (!isWorkWeek) {
      return 'Semana Libre';
    }

    return '';
  }

  generateAutoScheduleForWeek(weekDays) {
    const eligiblePeople = this.store.getEligiblePeople();
    const workingDays = weekDays.filter(day => this.isWorkingDay(day.dateStr));
    const W = workingDays.length;

    if (W === 0) {
      const generated = {};
      weekDays.forEach(dayObj => {
        this.store.setScheduleForDate(dayObj.dateStr, null, null);
        generated[dayObj.dateStr] = { parquePersonId: null, ofPersonId: null };
      });
      return generated;
    }

    if (eligiblePeople.length < W) {
      throw new Error(`Se necesitan al menos ${W} personas habilitadas para generar un cronograma de ${W} días laborables. Actualmente hay solo ${eligiblePeople.length} personas habilitadas.`);
    }

    const generated = {};
    const sortedForParque = [...eligiblePeople].sort((a, b) => (a.countParque || 0) - (b.countParque || 0));
    const sortedForOf = [...eligiblePeople].sort((a, b) => (a.countOF || 0) - (b.countOF || 0));

    let parqueIdx = 0;
    let ofIdx = 0;

    weekDays.forEach(dayObj => {
      if (!this.isWorkingDay(dayObj.dateStr)) {
        this.store.setScheduleForDate(dayObj.dateStr, null, null);
        generated[dayObj.dateStr] = { parquePersonId: null, ofPersonId: null };
        return;
      }

      const pPerson = sortedForParque[parqueIdx % sortedForParque.length];
      parqueIdx++;

      let oPerson = sortedForOf[ofIdx % sortedForOf.length];
      if (oPerson.id === pPerson.id) {
        ofIdx++;
        oPerson = sortedForOf[ofIdx % sortedForOf.length];
      }
      ofIdx++;

      this.store.setScheduleForDate(dayObj.dateStr, pPerson.id, oPerson.id);
      generated[dayObj.dateStr] = { parquePersonId: pPerson.id, ofPersonId: oPerson.id };
    });

    return generated;
  }

  // Generación Automática de Mantenimiento manteniendo personal fijo durante toda la semana
  generateAutoMaintScheduleForWeek(weekDays, fixedPersonId = null, fixedRoleKey = null) {
    const allPeople = this.store.getPeople();
    const generated = {};

    weekDays.forEach(dayObj => {
      if (!this.isWorkingDay(dayObj.dateStr)) {
        this.store.setMaintScheduleForDate(dayObj.dateStr, null);
        generated[dayObj.dateStr] = null;
        return;
      }

      if (allPeople.length === 0) {
        this.store.setMaintScheduleForDate(dayObj.dateStr, null);
        generated[dayObj.dateStr] = null;
        return;
      }

      const dailySchedule = this.store.getScheduleForDate(dayObj.dateStr);
      const parqueId = dailySchedule ? dailySchedule.parquePersonId : null;
      const ofId = dailySchedule ? dailySchedule.ofPersonId : null;

      let availablePeople = allPeople.filter(p => p.id !== parqueId && p.id !== ofId);

      const dayAssignments = {
        frente: [],
        sala: [],
        cocina: [],
        oficina: [],
        p360: [],
        ventanas: [],
        fregadero: []
      };

      // Fija al personal en la posición asignada toda la semana
      if (fixedPersonId && fixedRoleKey && dayAssignments[fixedRoleKey] !== undefined) {
        dayAssignments[fixedRoleKey].push(fixedPersonId);
        availablePeople = availablePeople.filter(p => p.id !== fixedPersonId);
      }

      let personIdx = 0;
      const getNextPerson = () => {
        if (availablePeople.length === 0) return 'null';
        const p = availablePeople[personIdx % availablePeople.length];
        personIdx++;
        return p.id;
      };

      const baseStructure = [
        { role: 'cocina', count: 1 },
        { role: 'oficina', count: 1 },
        { role: 'p360', count: 1 },
        { role: 'frente', count: 2 },
        { role: 'sala', count: 2 },
        { role: 'ventanas', count: 2 },
        { role: 'fregadero', count: 2 }
      ];

      baseStructure.forEach(item => {
        const currentCount = dayAssignments[item.role].length;
        const needed = item.count - currentCount;
        for (let i = 0; i < needed; i++) {
          if (personIdx < availablePeople.length) {
            dayAssignments[item.role].push(getNextPerson());
          }
        }
      });

      const flexibleRoles = ['frente', 'sala', 'ventanas', 'fregadero'];
      let flexIdx = 0;
      while (personIdx < availablePeople.length) {
        const targetRole = flexibleRoles[flexIdx % flexibleRoles.length];
        dayAssignments[targetRole].push(getNextPerson());
        flexIdx++;
      }

      this.store.setMaintScheduleForDate(dayObj.dateStr, dayAssignments);
      generated[dayObj.dateStr] = dayAssignments;
    });

    return generated;
  }
}

window.roleScheduler = new RoleScheduler(window.roleStore);