import { mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Logger } from 'src/commons/logger/logger.log';
import { FileTransport } from 'src/commons/logger/file-transport';
import { PlainFormatter } from 'src/commons/logger/plain-formatter';

describe('Logger lifecycle', () => {
  it('should wait for in-flight writes before closing transports', async () => {
    let finish: () => void;
    const write = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const close = jest.fn().mockResolvedValue(undefined);
    const logger = new Logger({ transports: [{ write, close }] });
    const logging = logger.info('test');
    const closing = logger.close();
    expect(close).not.toHaveBeenCalled();
    finish!();
    await logging;
    await closing;
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should propagate a write failure without preventing transport cleanup', async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const logger = new Logger({
      transports: [
        {
          write: jest.fn().mockRejectedValue(new Error('Disk unavailable')),
          close,
        },
      ],
    });
    await expect(logger.info('test')).rejects.toThrow('Disk unavailable');
    await logger.close();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should serialize concurrent file writes and close without waiting forever for drain', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'blog-logger-'));
    const file = path.join(directory, 'test.log');
    const logger = new Logger({
      transports: [
        new FileTransport({
          dir: directory,
          filePrefix: 'test',
          rotateDaily: false,
          formatter: new PlainFormatter('fr-FR', true),
        }),
      ],
    });
    try {
      await Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          logger.info('message-' + index),
        ),
      );
      await logger.close();
      const lines = (await readFile(file, 'utf8')).trim().split('\n');
      expect(lines).toHaveLength(20);
      lines.forEach((line, index) =>
        expect(line).toContain('message-' + index),
      );
    } finally {
      await logger.close();
      await unlink(file);
      await rmdir(directory);
    }
  });
});
