/**
 * Abstracción de jobs. Hoy corre en proceso (in-process). Mañana se reemplaza
 * por una implementación con Redis/BullMQ sin tocar el código que la usa.
 */
export type JobHandler<T> = (payload: T) => Promise<void>;

export interface JobQueue {
  enqueue<T>(name: string, payload: T, handler: JobHandler<T>): Promise<void>;
}

class InProcessJobQueue implements JobQueue {
  async enqueue<T>(name: string, payload: T, handler: JobHandler<T>): Promise<void> {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[jobs] "${name}" falló:`, err);
      throw err;
    }
  }
}

export const jobQueue: JobQueue = new InProcessJobQueue();
