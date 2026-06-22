interface RiskScoreBadgeProps {
  score: number | null;
  showLabel?: boolean;
}

export function RiskScoreBadge({ score, showLabel = true }: RiskScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        Sin calcular
      </span>
    );
  }

  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;

  const colorCls = isHigh
    ? 'bg-red-100 text-red-700 border border-red-200'
    : isMedium
      ? 'bg-amber-100 text-amber-700 border border-amber-200'
      : 'bg-emerald-100 text-emerald-700 border border-emerald-200';

  const label = isHigh ? 'Alto riesgo' : isMedium ? 'Riesgo medio' : 'Bajo riesgo';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorCls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
      {score}
      {showLabel && <span className="ml-0.5 font-normal opacity-70">— {label}</span>}
    </span>
  );
}
