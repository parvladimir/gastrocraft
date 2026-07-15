type SectionClosingStatementProps = {
  className?: string;
  firstLine: string;
  secondLine: string;
};

export function SectionClosingStatement({
  className = "",
  firstLine,
  secondLine
}: SectionClosingStatementProps) {
  return (
    <div
      className={`max-w-3xl border-l border-premium-gold/60 py-2 pl-6 ${className}`}
    >
      <p className="font-heading text-lg font-semibold leading-7 text-warm-white sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9">
        {firstLine}
        <span className="mt-1 block text-premium-gold">{secondLine}</span>
      </p>
    </div>
  );
}
