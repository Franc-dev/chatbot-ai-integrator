import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("signal-console");

export function span<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (s) => {
    try {
      return await fn();
    } catch (err) {
      s.recordException(err as Error);
      throw err;
    } finally {
      s.end();
    }
  });
}
