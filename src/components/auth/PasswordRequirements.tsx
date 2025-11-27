import { PasswordValidation } from "@/lib/utils/passwordValidation";

interface PasswordRequirementsProps {
  validation: PasswordValidation;
  touched: boolean;
}

export default function PasswordRequirements({
  validation,
  touched,
}: PasswordRequirementsProps) {
  if (!touched) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Password must contain:
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        <RequirementItem
          met={validation.requirements.minLength}
          text="At least 8 characters"
        />
        <RequirementItem
          met={validation.requirements.hasUpperCase}
          text="One uppercase letter (A-Z)"
        />
        <RequirementItem
          met={validation.requirements.hasLowerCase}
          text="One lowercase letter (a-z)"
        />
        <RequirementItem
          met={validation.requirements.hasNumber}
          text="One number (0-9)"
        />
        <RequirementItem
          met={validation.requirements.hasSpecialChar}
          text="One special character (!@#$%^&*...)"
        />
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <svg
          className="w-4 h-4 text-success flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-base-content/30 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span
        className={`text-xs ${
          met ? "text-green-400" : "text-muted-foreground"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
