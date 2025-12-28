interface CalendarEventParams {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatDateToGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const { title, description, startDate, endDate, location } = params;

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDateToGoogle(startDate)}/${formatDateToGoogle(endDate)}`,
  });

  if (description) {
    // Strip HTML tags from description for plain text
    const plainDescription = description.replace(/<[^>]*>/g, '');
    queryParams.append('details', plainDescription);
  }

  if (location) {
    queryParams.append('location', location);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(params: CalendarEventParams): string {
  const { title, description, startDate, endDate, location } = params;

  const baseUrl = 'https://outlook.live.com/calendar/0/action/compose';
  const queryParams = new URLSearchParams({
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    allday: 'false',
  });

  if (description) {
    const plainDescription = description.replace(/<[^>]*>/g, '');
    queryParams.append('body', plainDescription);
  }

  if (location) {
    queryParams.append('location', location);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generate ICS file content for download (Apple Calendar, etc.)
 */
export function generateICSContent(params: CalendarEventParams): string {
  const { title, description, startDate, endDate, location } = params;

  const plainDescription = description ? description.replace(/<[^>]*>/g, '') : '';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Swift Events//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateToICS(startDate)}`,
    `DTEND:${formatDateToICS(endDate)}`,
    `SUMMARY:${escapeICSText(title)}`,
    plainDescription ? `DESCRIPTION:${escapeICSText(plainDescription)}` : '',
    location ? `LOCATION:${escapeICSText(location)}` : '',
    `UID:${Date.now()}@swiftevents`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return icsContent;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download ICS file
 */
export function downloadICSFile(params: CalendarEventParams): void {
  const icsContent = generateICSContent(params);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${params.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Build location string from event address
 */
export function buildLocationString(address?: {
  name?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zipcode?: string | null;
}): string {
  if (!address) return '';

  return [
    address.name,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.zipcode,
  ].filter(Boolean).join(', ');
}
