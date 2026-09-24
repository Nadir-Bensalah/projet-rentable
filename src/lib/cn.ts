export function cn(...classes: (string | false | null | undefined | 0 | 0n)[]) {
  return classes.filter(Boolean).join(" ");
}
