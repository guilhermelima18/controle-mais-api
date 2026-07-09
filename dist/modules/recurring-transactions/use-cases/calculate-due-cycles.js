"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDueCycles = calculateDueCycles;
function addUTCDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}
function addUTCMonths(date, months) {
    const year = date.getUTCFullYear();
    const targetMonthIndex = date.getUTCMonth() + months;
    const daysInTargetMonth = new Date(Date.UTC(year, targetMonthIndex + 1, 0)).getUTCDate();
    const clampedDay = Math.min(date.getUTCDate(), daysInTargetMonth);
    return new Date(Date.UTC(year, targetMonthIndex, clampedDay, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}
function nextCycleDate(date, frequency) {
    switch (frequency) {
        case "DAILY":
            return addUTCDays(date, 1);
        case "WEEKLY":
            return addUTCDays(date, 7);
        case "MONTHLY":
            return addUTCMonths(date, 1);
        case "YEARLY":
            return addUTCMonths(date, 12);
    }
}
function calculateDueCycles({ startDate, lastGeneratedDate, endDate, frequency, referenceDate, }) {
    const cycles = [];
    let cursor = lastGeneratedDate
        ? nextCycleDate(lastGeneratedDate, frequency)
        : startDate;
    while (cursor <= referenceDate && (!endDate || cursor <= endDate)) {
        cycles.push(cursor);
        cursor = nextCycleDate(cursor, frequency);
    }
    return cycles;
}
