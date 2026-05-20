import CircuitBreaker from 'opossum';
import { UpstreamError } from './errors.js';
import { logger } from './logger.js';

const registry = new Map();

export function wrap(name, fn, opts = {}) {
  if (registry.has(name)) return registry.get(name);

  const breaker = new CircuitBreaker(fn, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10_000,
    rollingCountTimeout: 10_000,
    rollingCountBuckets: 10,
    volumeThreshold: 5,
    ...opts,
    name,
  });

  breaker.on('open', () => logger.warn('breaker open', { name }));
  breaker.on('halfOpen', () => logger.info('breaker half-open', { name }));
  breaker.on('close', () => logger.info('breaker closed', { name }));
  breaker.on('reject', () => logger.warn('breaker reject (fast-fail)', { name }));

  breaker.fallback(() => {
    throw new UpstreamError(`Upstream ${name} unavailable`, { upstream: name });
  });

  registry.set(name, breaker);
  return breaker;
}

export function getBreakerMetrics() {
  const out = [];
  for (const [name, breaker] of registry) {
    const s = breaker.stats;
    out.push({
      name,
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: {
        successes: s.successes,
        failures: s.failures,
        rejects: s.rejects,
        timeouts: s.timeouts,
        fallbacks: s.fallbacks,
        latencyMean: s.latencyMean,
      },
    });
  }
  return out;
}

export function listBreakerNames() {
  return [...registry.keys()];
}
