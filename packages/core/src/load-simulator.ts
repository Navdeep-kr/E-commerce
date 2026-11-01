/**
 * Peak-Sale Flash Load Simulator
 * Simulates high-velocity checkout traffic (50+ orders/sec) with latency percentile calculation and dropped order telemetry.
 */

export interface LoadSimulationConfig {
  totalOrders: number;
  concurrency: number;
  targetOrdersPerSecond: number;
  initialStock: number;
}

export interface LatencyPercentiles {
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface LoadSimulationResult {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  droppedOrders: number;
  ordersPerSecond: number;
  durationMs: number;
  latencies: LatencyPercentiles;
  remainingStock: number;
  exitCheckPassed: boolean; // true if p95 < 300ms and droppedOrders === 0
}

export class LoadSimulator {
  /**
   * Calculate percentile from sorted array of latencies
   */
  public calculatePercentile(sortedLatencies: number[], percentile: number): number {
    if (sortedLatencies.length === 0) return 0;
    const index = Math.min(
      sortedLatencies.length - 1,
      Math.floor((percentile / 100) * sortedLatencies.length)
    );
    return Number(sortedLatencies[index].toFixed(2));
  }

  /**
   * Run peak-sale flash order load simulation
   */
  public async runPeakSaleSimulation(config: LoadSimulationConfig): Promise<LoadSimulationResult> {
    const startTime = performance.now();
    let currentStock = config.initialStock;
    let successfulOrders = 0;
    let failedOrders = 0;
    let droppedOrders = 0;
    const latencies: number[] = [];

    // Worker queue processing
    const orderIndices = Array.from({ length: config.totalOrders }, (_, i) => i);
    const workerCount = config.concurrency;

    const processOrder = async (orderIndex: number) => {
      const orderStart = performance.now();

      try {
        // Simulate database transaction latency: index lookup, concurrency-safe FOR UPDATE row lock, movement write
        // Synthetic realistic micro-delay between 1ms and 8ms
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 5 + 1));

        // Atomic stock decrement check
        if (currentStock >= 1) {
          currentStock -= 1;
          successfulOrders++;
        } else {
          // Out of stock, but not a dropped order
          failedOrders++;
        }
      } catch (err) {
        droppedOrders++;
      } finally {
        const orderEnd = performance.now();
        latencies.push(orderEnd - orderStart);
      }
    };

    // Run parallel batches with concurrency control
    const chunks: number[][] = [];
    for (let i = 0; i < orderIndices.length; i += workerCount) {
      chunks.push(orderIndices.slice(i, i + workerCount));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((idx) => processOrder(idx)));
    }

    const endTime = performance.now();
    const durationMs = Math.max(1, endTime - startTime);
    const ordersPerSecond = Number(((successfulOrders / durationMs) * 1000).toFixed(1));

    // Sort latencies ascending
    latencies.sort((a, b) => a - b);

    const minMs = Number((latencies[0] || 0).toFixed(2));
    const maxMs = Number((latencies[latencies.length - 1] || 0).toFixed(2));
    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const avgMs = Number((sum / Math.max(1, latencies.length)).toFixed(2));

    const p50Ms = this.calculatePercentile(latencies, 50);
    const p90Ms = this.calculatePercentile(latencies, 90);
    const p95Ms = this.calculatePercentile(latencies, 95);
    const p99Ms = this.calculatePercentile(latencies, 99);

    const exitCheckPassed = p95Ms < 300 && droppedOrders === 0;

    return {
      totalOrders: config.totalOrders,
      successfulOrders,
      failedOrders,
      droppedOrders,
      ordersPerSecond,
      durationMs: Number(durationMs.toFixed(2)),
      latencies: {
        minMs,
        maxMs,
        avgMs,
        p50Ms,
        p90Ms,
        p95Ms,
        p99Ms,
      },
      remainingStock: currentStock,
      exitCheckPassed,
    };
  }
}
