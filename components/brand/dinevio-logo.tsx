type DinevioLogoProps = {
  showDescriptor?: boolean;
  size?: "md" | "lg";
};

export function DinevioLogo({
  showDescriptor = true,
  size = "md"
}: DinevioLogoProps) {
  const wordmarkSize =
    size === "lg" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";

  return (
    <span
      className="inline-flex min-w-0 items-center gap-3"
      aria-label="DINEVIO – Restaurant Digital Solutions"
    >
      <span
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-premium-gold/35 bg-[#101a2c] sm:h-10 sm:w-10"
        aria-hidden="true"
      >
        <span className="font-heading text-lg font-bold leading-none text-premium-gold sm:text-xl">
          D
        </span>
        <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-premium-gold" />
      </span>
      <span className="inline-flex min-w-0 flex-col">
        <span
          className={`font-heading font-semibold leading-none tracking-[0.08em] text-warm-white ${wordmarkSize}`}
        >
          DINE<span className="text-premium-gold">V</span>IO
        </span>
        {showDescriptor ? (
          <span className="mt-1 hidden text-[0.64rem] font-semibold uppercase leading-none tracking-[0.18em] text-premium-gold sm:inline">
            Restaurant Digital Solutions
          </span>
        ) : null}
      </span>
    </span>
  );
}
