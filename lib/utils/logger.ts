type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  private formatMessage(logContext: LogContext): string {
    const { timestamp, level, message, context } = logContext;
    const emoji = this.getEmoji(level);
    
    let formattedMessage = `${emoji} [${timestamp}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formattedMessage += ` | ${JSON.stringify(context)}`;
    }
    
    return formattedMessage;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return '📌';
      case 'warn': return '⚠️';
      case 'error': return '❌';
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const logContext: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    const formattedMessage = this.formatMessage(logContext);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error) {
      errorContext.error = error;
    }
    
    this.log('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();