import type { Logger } from './Logger'

import { LogLevel } from './Logger'

export abstract class BaseLogger implements Logger {
  public logLevel: LogLevel

  public constructor(logLevel: LogLevel = LogLevel.off) {
    this.logLevel = logLevel
  }

  public isEnabled(logLevel: LogLevel) {
    return logLevel >= this.logLevel
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  public abstract test(message: string, data?: Record<string, any>): void
  public abstract trace(message: string, data?: Record<string, any>): void
  public abstract debug(message: string, data?: Record<string, any>): void
  public abstract info(message: string, data?: Record<string, any>): void
  public abstract warn(message: string, data?: Record<string, any>): void
  public abstract error(message: string, data?: Record<string, any>): void
  public abstract fatal(message: string, data?: Record<string, any>): void
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
