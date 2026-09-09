export interface ILogger {
  info(message: string, ...extra: unknown[]): void;
  warn(message: string, ...extra: unknown[]): void;
  error(message: string, ...extra: unknown[]): void;
  debug(message: string, ...extra: unknown[]): void;
}
