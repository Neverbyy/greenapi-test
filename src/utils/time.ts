export function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
