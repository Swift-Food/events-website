"use client";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
      <path
        d="M9.5 14.25L6.75 11.5L7.8125 10.4375L9.5 12.125L14.1875 7.4375L15.25 8.5L9.5 14.25Z"
        fill="white"
      />
    </svg>
  );
}

export default function VerifiedBadge({
  size = "sm",
  showLabel = false,
  className = "",
}: VerifiedBadgeProps) {
  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const labelSize = size === "sm" ? "text-sm" : "text-sm";

  return (
    <span
      className={`inline-flex items-end gap-1.5 ${className}`}
      title="Verified"
    >
      <CheckmarkIcon className={`${iconSize} shrink-0`} />
      {showLabel && (
        <span className={`${labelSize} font-medium text-[#1D9BF0]`}>Verified</span>
      )}
    </span>
  );
}
