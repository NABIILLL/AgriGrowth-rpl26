type AgrigrowthLogoProps = {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  tone?: "dark" | "light";
  imageSrc?: string;
  imageAlt?: string;
};

export default function AgrigrowthLogo({
  className = "h-9 w-9",
  showText = true,
  textClassName = "text-xl font-bold text-white",
  tone = "dark",
  imageSrc,
  imageAlt = "Agrigrowth logo",
}: AgrigrowthLogoProps) {
  // Two variants: compact icon and horizontal full logo
  return (
    <div className={`flex items-center gap-3 ${showText ? "" : ""}`}>
      {/* Icon */}
      <div aria-hidden className={`${className} flex items-center justify-center`}>
        {imageSrc ? (
          <img alt={imageAlt} className="h-full w-full object-contain" src={imageSrc} />
        ) : (
          <svg viewBox="0 0 64 64" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" role="img">
            <rect x="2" y="2" width="60" height="60" rx="10" fill="rgba(255,255,255,0.06)" />
            <g transform="translate(8,8)">
              <path d="M24 2c-6 0-10 5-10 10 0 8 10 15 10 15s10-7 10-15c0-5-4-10-10-10z" fill="#ffffff" />
              <path d="M15 26c0 0 4-3 9-3s9 3 9 3-4 7-9 7-9-7-9-7z" fill="#f3b300" />
              <circle cx="34" cy="8" r="2" fill="#f3b300" />
            </g>
          </svg>
        )}
      </div>

      {/* Full text */}
      {showText ? (
        <div className={textClassName}>
          <span className="block">Agrigrowth</span>
          <span className="block text-sm font-normal text-white/80">Monitoring</span>
        </div>
      ) : null}
    </div>
  );
}