export const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    // Parse date-only strings (YYYY-MM-DD) as UTC to avoid timezone shift
    const date = new Date(dateString + (dateString.length === 10 ? 'T00:00:00Z' : ''));
    const opts: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };
    const dayOfWeek = date.toLocaleDateString('en-US', { ...opts, weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { ...opts, month: 'long' });
    const day = date.toLocaleDateString('en-US', { ...opts, day: '2-digit' });
    const year = date.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
    return `${dayOfWeek}, ${month} ${day}, ${year}`;
};