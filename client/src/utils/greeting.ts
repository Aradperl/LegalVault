/** Local-time greeting shown on the signed-in Home hero. */
export function timeOfDayGreeting(username: string, now = new Date()): string {
  const name = username.trim() || 'there';
  const hour = now.getHours();
  if (hour >= 5 && hour <= 11) return `Good morning, ${name}`;
  if (hour >= 12 && hour <= 16) return `Good afternoon, ${name}`;
  if (hour >= 17 && hour <= 20) return `Good evening, ${name}`;
  return `Welcome back, ${name}`;
}
