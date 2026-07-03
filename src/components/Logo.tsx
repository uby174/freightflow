export function Logo({
  showText = true,
  className = "",
}: {
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="grid place-items-center rounded-lg bg-secondary text-white font-black tracking-tight shrink-0"
        style={{ width: 40, height: 40, fontSize: 18 }}
        aria-hidden
      >
        SN
      </span>
      {showText && (
        <span className="leading-tight">
          <span className="block font-black text-primary text-base sm:text-lg tracking-tight">
            SN Groupage Solutions
          </span>
          <span className="block text-[11px] text-gold-dark font-semibold -mt-0.5">
            Transport de colis en toute confiance
          </span>
        </span>
      )}
    </span>
  );
}
