export interface AdaptiveParams { currentInterval: number; minInterval: number; maxInterval: number; changeRatio: number; }
export function computeNextInterval(params: AdaptiveParams): number {
  const { currentInterval, minInterval, maxInterval, changeRatio } = params;
  let next: number;
  if (changeRatio > 0.5) next = currentInterval / 2;
  else if (changeRatio > 0.1) next = currentInterval;
  else next = currentInterval * 1.5;
  return Math.max(minInterval, Math.min(maxInterval, Math.round(next)));
}
