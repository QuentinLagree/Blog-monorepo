import { LoggerService } from 'src/commons/logger/logger.service';
import { LogManager } from 'src/commons/logger/log-manager';
import * as runtime from 'src/commons/logger/logger.runtime';

describe('Automatic log maintenance', () => {
  const initialEnvironment = process.env['NODE_ENV'];
  const initialEnabled = process.env['LOG_ARCHIVE_ENABLED'];

  afterEach(() => {
    process.env['NODE_ENV'] = initialEnvironment;
    if (initialEnabled === undefined) delete process.env['LOG_ARCHIVE_ENABLED'];
    else process.env['LOG_ARCHIVE_ENABLED'] = initialEnabled;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not touch logs in tests or when archiving is disabled', async () => {
    const archive = jest
      .spyOn(LogManager.prototype, 'archive')
      .mockResolvedValue([]);
    const service = new LoggerService();
    process.env['NODE_ENV'] = 'test';
    service.onModuleInit();
    process.env['NODE_ENV'] = 'development';
    process.env['LOG_ARCHIVE_ENABLED'] = 'false';
    service.onModuleInit();
    expect(archive).not.toHaveBeenCalled();
    await service.onModuleDestroy();
  });

  it('archives on startup and hourly, then stops during shutdown', async () => {
    jest.useFakeTimers();
    process.env['NODE_ENV'] = 'development';
    delete process.env['LOG_ARCHIVE_ENABLED'];
    const archive = jest
      .spyOn(LogManager.prototype, 'archive')
      .mockResolvedValue([]);
    const service = new LoggerService();
    service.onModuleInit();
    expect(archive).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(archive).toHaveBeenCalledTimes(2);
    await service.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(archive).toHaveBeenCalledTimes(2);
  });

  it('waits for running maintenance before closing the logger', async () => {
    process.env['NODE_ENV'] = 'development';
    delete process.env['LOG_ARCHIVE_ENABLED'];
    let finish!: () => void;
    jest.spyOn(LogManager.prototype, 'archive').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve([]);
        }),
    );
    const close = jest.spyOn(runtime, 'closeRuntimeLogger').mockResolvedValue();
    const service = new LoggerService();
    service.onModuleInit();
    const closing = service.onModuleDestroy();
    expect(close).not.toHaveBeenCalled();
    finish();
    await closing;
    expect(close).toHaveBeenCalledTimes(1);
  });
});
