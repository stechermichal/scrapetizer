import { logger } from '@/lib/utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info messages with correct format', () => {
      logger.info('Test message');
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleInfoSpy.mock.calls[0][0];
      expect(logCall).toContain('📌');
      expect(logCall).toContain('Test message');
    });

    it('should include context when provided', () => {
      logger.info('Test message', { userId: 123, action: 'test' });
      
      const logCall = consoleInfoSpy.mock.calls[0][0];
      expect(logCall).toContain('{"userId":123,"action":"test"}');
    });
  });

  describe('warn', () => {
    it('should log warning messages with correct format', () => {
      logger.warn('Warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleWarnSpy.mock.calls[0][0];
      expect(logCall).toContain('⚠️');
      expect(logCall).toContain('Warning message');
    });
  });

  describe('error', () => {
    it('should log error messages with error details', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('❌');
      expect(logCall).toContain('Error occurred');
      expect(logCall).toContain('"name":"Error"');
      expect(logCall).toContain('"message":"Test error"');
    });

    it('should handle non-Error objects', () => {
      logger.error('Error occurred', 'string error');
      
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('"error":"string error"');
    });

    it('should work without error parameter', () => {
      logger.error('Error message');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('Error message');
    });
  });

  describe('debug', () => {
    it('should only log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in production
      process.env.NODE_ENV = 'production';
      logger.debug('Debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      
      // Test in development
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('timestamp', () => {
    it('should include ISO timestamp in all logs', () => {
      const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
      
      logger.info('Test');
      const logCall = consoleInfoSpy.mock.calls[0][0];
      expect(logCall).toMatch(isoDateRegex);
    });
  });
});