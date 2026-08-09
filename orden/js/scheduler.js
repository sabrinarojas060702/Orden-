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

  // Generación Automática Mantenimiento (Utiliza a TODOS: aptos y no aptos)
  generateAutoMaintScheduleForWeek(weekDays) {
    const allPeople = this.store.getPeople();
    const generated = {};

    let personIndex = 0;

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

      const dayAssignments = {
        frente: [],
        sala: [],
        cocina: [],
        oficina: [],
        p360: [],
        ventanas: [],
        fregadero: []
      };

      const getNextPerson = () => {
        const p = allPeople[personIndex % allPeople.length];
        personIndex++;
        return p.id;
      };

      // Cupos básicos requeridos
      // Frente (2 o 3) -> 2 base
      dayAssignments.frente.push(getNextPerson());
      dayAssignments.frente.push(getNextPerson());

      // Sala (2)
      dayAssignments.sala.push(getNextPerson());
      dayAssignments.sala.push(getNextPerson());

      // Cocina (1)
      dayAssignments.cocina.push(getNextPerson());

      // Oficina (1)
      dayAssignments.oficina.push(getNextPerson());

      // 360 (1)
      dayAssignments.p360.push(getNextPerson());

      // Ventanas (2)
      dayAssignments.ventanas.push(getNextPerson());

      // Fregadero (2)
      dayAssignments.fregadero.push(getNextPerson());

      // Si quedan personas sin asignar este día (sobrantes), distribuir en áreas con cupo amplio (Frente, Sala, Ventanas, Fregadero)
      const assignedCountThisDay = 2 + 2 + 1 + 1 + 1 + 2 + 2; // 11 posiciones
      if (allPeople.length > assignedCountThisDay) {
        const leftover = allPeople.length - assignedCountThisDay;
        const extraTargets = ['frente', 'sala', 'ventanas', 'fregadero'];
        for (let i = 0; i < leftover; i++) {
          const targetRole = extraTargets[i % extraTargets.length];
          dayAssignments[targetRole].push(getNextPerson());
        }
      }

      this.store.setMaintScheduleForDate(dayObj.dateStr, dayAssignments);
      generated[dayObj.dateStr] = dayAssignments;
    });

    return generated;
  }
}

window.roleScheduler = new RoleScheduler(window.roleStore);