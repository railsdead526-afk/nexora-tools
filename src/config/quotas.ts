export type AccountPlan = 'free' | 'pro';

export const TOOL_QUOTA_LIMITS = {
  downloader: { free: 3, pro: 50 },
  bg_remover: { free: 5, pro: 100 },
  heavy_default: { free: 5, pro: 100 },
} as const;

export type QuotaTool = keyof typeof TOOL_QUOTA_LIMITS;

export function getQuotaLimit(tool: QuotaTool, plan: AccountPlan) {
  return TOOL_QUOTA_LIMITS[tool][plan];
}

export function isQuotaTool(value: string): value is QuotaTool {
  return Object.prototype.hasOwnProperty.call(TOOL_QUOTA_LIMITS, value);
}
