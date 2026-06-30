const requestLog = new Map<string, number[]>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const timestamps = requestLog.get(identifier) ?? []
  const recentTimestamps = timestamps.filter(t => now - t < windowMs)

  if (recentTimestamps.length >= maxRequests) {
    requestLog.set(identifier, recentTimestamps)
    return { allowed: false, remaining: 0 }
  }

  recentTimestamps.push(now)
  requestLog.set(identifier, recentTimestamps)
  return { allowed: true, remaining: maxRequests - recentTimestamps.length }
}
