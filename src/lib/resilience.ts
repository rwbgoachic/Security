import { CircuitBreakerError } from './errors';

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly maxFailures: number;
  private readonly name: string;

  constructor(name: string, maxFailures = 5) {
    this.name = name;
    this.maxFailures = maxFailures;
  }

  private isOpen(): boolean {
    if (this.failures >= this.maxFailures) {
      // Check if enough time has passed to try again
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new CircuitBreakerError(`Service ${this.name} is unavailable`);
    }

    try {
      const result = await fn();
      this.reset(); // Reset on successful execution
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }
}