/** Склейка классов: пропускает false, undefined и пустые строки. */
export function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
