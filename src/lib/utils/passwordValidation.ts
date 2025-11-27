export interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidation {
  requirements: PasswordRequirements;
  allMet: boolean;
}

export const validatePassword = (password: string): PasswordValidation => {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allMet = Object.values(requirements).every((req) => req);
  return { requirements, allMet };
};
