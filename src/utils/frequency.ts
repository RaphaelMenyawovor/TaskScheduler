const normalize = (value?: string) => (value ?? '').trim().toLowerCase();

export const isSupportedFrequency = (value: string): boolean => {
  const normalized = normalize(value);
  return normalized === 'hourly' || normalized === 'daily' || normalized === 'weekly' || normalized === 'monthly';
};

// const getHourlyIntervalMinutes = (value: string): number | null => {
//   const normalized = normalize(value);
//   if (normalized === 'hourly') return 60;
//   return null;
// };

export const frequencyToCron = (frequency: string, anchor: Date = new Date()): string | null => {
  const normalized = normalize(frequency);
  if (!isSupportedFrequency(normalized)) return null;

  const minute = anchor.getMinutes();
  const hour = anchor.getHours();
  const dayOfMonth = anchor.getDate();
  const dayOfWeek = anchor.getDay(); // 0-6, Sunday is 0 zero indexed

  switch (normalized) {
    case 'hourly':
      return '0 * * * *';
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    default:
      return null;
  }
};

export const getNextDueDate = (frequency: string, from: Date): Date | null => {
  const normalized = normalize(frequency);
  if (!isSupportedFrequency(normalized)) return null;

  const base = new Date(from);

  switch (normalized) {
    case 'hourly':
      base.setHours(base.getHours() + 1);
      return base;
    case 'daily':
      base.setDate(base.getDate() + 1);
      return base;
    case 'weekly':
      base.setDate(base.getDate() + 7);
      return base;
    case 'monthly':
      base.setMonth(base.getMonth() + 1);
      return base;
    default:
      return null;
  }
};

export const normalizeFrequency = (value: string): string => normalize(value);
