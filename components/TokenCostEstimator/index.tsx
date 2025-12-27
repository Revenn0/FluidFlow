/**
 * Token Cost Estimator Component
 *
 * Displays estimated API costs for AI usage
 */

import React, { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import { calculateCost, formatCost, MODEL_PRICING } from '@/services/tokenCostEstimator';

export interface TokenCostEstimatorProps {
  model: string;
  inputTokens: number;
  outputTokens?: number;
  className?: string;
}

export const TokenCostEstimator: React.FC<TokenCostEstimatorProps> = ({
  model,
  inputTokens,
  outputTokens = 0,
  className = '',
}) => {
  const estimate = useMemo(() => {
    return calculateCost(model, inputTokens, outputTokens);
  }, [model, inputTokens, outputTokens]);

  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`} style={{ color: 'var(--theme-text-muted)' }}>
        <DollarSign className="w-4 h-4" />
        <span>Pricing not available for {model}</span>
      </div>
    );
  }

  const totalTokens = inputTokens + outputTokens;
  const isFree = pricing.inputPricePer1M === 0 && pricing.outputPricePer1M === 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-xs">
        <DollarSign className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
        <span style={{ color: 'var(--theme-text-muted)' }}>Est. Cost:</span>
        <span className="font-mono font-semibold" style={{ color: isFree ? 'var(--color-success)' : 'var(--theme-text-primary)' }}>
          {isFree ? 'Free' : formatCost(estimate.totalCost, estimate.currency)}
        </span>
      </div>

      {/* Token breakdown */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-info)' }} />
          <span>In: {inputTokens.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-feature)' }} />
          <span>Out: {outputTokens.toLocaleString()}</span>
        </span>
        <span className="font-mono" style={{ color: 'var(--theme-text-muted)' }}>
          ({totalTokens.toLocaleString()} total)
        </span>
      </div>
    </div>
  );
};

export default TokenCostEstimator;
