/**
 * Slot and Schedule Utilities for TokenQ
 * Handles parsing of slot timings and automatic expiration of concluded consultation tokens.
 */

/**
 * Extracts the end time of a given slot string as a Date object for the specified booking date.
 * Handles diverse formats:
 * - "6:00 PM – 9:00 PM (Morning)"
 * - "9:00 AM – 1:00 PM"
 * - "06:00 AM - 09:30 AM"
 * - "4:00 PM – 8:00 PM (Evening)"
 * - "18:00 - 21:00"
 * - "6:00 PM" (single time -> +30 mins)
 * - "Morning Session" / "Evening Session"
 *
 * @param {string} slotStr - The slot or timing string
 * @param {Date|string|number} bookingCreatedAt - The booking creation date or reference date
 * @returns {Date|null}
 */
export function getSlotEndTime(slotStr, bookingCreatedAt = new Date()) {
  const bDate = bookingCreatedAt ? new Date(bookingCreatedAt) : new Date();
  if (isNaN(bDate.getTime())) return null;

  const year = bDate.getFullYear();
  const month = bDate.getMonth();
  const date = bDate.getDate();

  const str = String(slotStr || '').trim();

  // Match time tokens like "6:00 PM", "6.00 PM", "9:30 AM", "18:00", "01:00 PM", "6 PM", "9 AM"
  const regex = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/gi;
  const matches = [];
  let m;
  while ((m = regex.exec(str)) !== null) {
    matches.push({
      full: m[0],
      hours: parseInt(m[1], 10),
      minutes: m[2] ? parseInt(m[2], 10) : 0,
      ampm: m[3] ? m[3].toLowerCase() : null
    });
  }

  let endHours = 23;
  let endMinutes = 59;
  let isMidnightCrossed = false;

  if (matches.length >= 2) {
    // Range format: e.g. "6:00 PM – 9:00 PM", "9:00 AM – 1:00 PM", "10:00 - 13:00"
    const startMatch = matches[0];
    const endMatch = matches[matches.length - 1]; // take the last match as end time

    let startAmpm = startMatch.ampm;
    let endAmpm = endMatch.ampm;

    // Detect session hints if am/pm missing
    const lower = str.toLowerCase();
    const isEveningSession = lower.includes('evening') || lower.includes('night');
    const isMorningSession = lower.includes('morning');

    if (!endAmpm) {
      if (startAmpm) {
        if (endMatch.hours < startMatch.hours) {
          endAmpm = startAmpm === 'am' ? 'pm' : 'am';
        } else {
          endAmpm = startAmpm;
        }
      } else if (isEveningSession) {
        endAmpm = 'pm';
      } else if (isMorningSession && endMatch.hours <= 12) {
        endAmpm = endMatch.hours === 12 || endMatch.hours < 7 ? 'pm' : 'am';
      }
    }

    if (!startAmpm) {
      if (endAmpm === 'pm' && startMatch.hours >= 7 && startMatch.hours <= 11 && endMatch.hours < 7) {
        startAmpm = 'am';
      } else if (endAmpm) {
        startAmpm = endAmpm;
      } else if (isEveningSession) {
        startAmpm = 'pm';
      } else if (isMorningSession) {
        startAmpm = 'am';
      }
    }

    let h = endMatch.hours;
    const min = endMatch.minutes;

    if (endAmpm === 'pm' && h < 12) h += 12;
    if (endAmpm === 'am' && h === 12) h = 0;

    // If start was PM and end was AM (crosses midnight)
    if (startAmpm === 'pm' && endAmpm === 'am') {
      isMidnightCrossed = true;
    }

    endHours = h;
    endMinutes = min;
  } else if (matches.length === 1) {
    // Single time e.g. "6:00 PM"
    const match = matches[0];
    let h = match.hours;
    const min = match.minutes;
    if (match.ampm === 'pm' && h < 12) h += 12;
    if (match.ampm === 'am' && h === 12) h = 0;

    // Add 30 minutes duration for a single slot time
    endHours = h;
    endMinutes = min + 30;
    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }
  } else {
    // No explicit numeric time found; check session words
    const lower = str.toLowerCase();
    if (lower.includes('morning')) {
      endHours = 13; // 1:30 PM
      endMinutes = 30;
    } else if (lower.includes('afternoon')) {
      endHours = 17; // 5:00 PM
      endMinutes = 0;
    } else if (lower.includes('evening') || lower.includes('night')) {
      endHours = 22; // 10:00 PM
      endMinutes = 0;
    }
  }

  const slotEndTime = new Date(year, month, date, endHours, endMinutes, 0, 0);
  if (isMidnightCrossed) {
    slotEndTime.setDate(slotEndTime.getDate() + 1);
  }

  return slotEndTime;
}

/**
 * Checks if a booking's doctor time slot has finished or concluded.
 *
 * @param {Object} booking - The booking document or object
 * @param {number} delayMinutes - Any doctor delay in minutes
 * @returns {boolean}
 */
export function isBookingExpired(booking, delayMinutes = 0) {
  if (!booking) return false;

  // Completed or explicitly cancelled bookings maintain their final status
  if (booking.status === 'done' || booking.status === 'cancelled') {
    return false;
  }

  // Already marked as expired
  if (booking.status === 'expired') {
    return true;
  }

  // Only waiting or serving tokens can expire
  const bDate = new Date(booking.createdAt || Date.now());
  if (isNaN(bDate.getTime())) return false;

  const now = new Date();

  // 1. If booked on a previous calendar date (IST / local date boundary), it has expired
  const isPreviousDay =
    bDate.getFullYear() < now.getFullYear() ||
    (bDate.getFullYear() === now.getFullYear() && bDate.getMonth() < now.getMonth()) ||
    (bDate.getFullYear() === now.getFullYear() && bDate.getMonth() === now.getMonth() && bDate.getDate() < now.getDate());

  if (isPreviousDay) {
    return true;
  }

  // 2. If booked for today, check whether the doctor's time slot has ended
  const slotEndTime = getSlotEndTime(booking.slot, bDate);
  if (!slotEndTime) {
    return false;
  }

  // Allow for doctor delay buffer (e.g. delayMinutes)
  const totalDelayMs = (Number(delayMinutes) || 0) * 60 * 1000;
  const expirationThreshold = slotEndTime.getTime() + totalDelayMs;

  return now.getTime() > expirationThreshold;
}
