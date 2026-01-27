export const checkPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500" };
  if (score === 2) return { label: "Medium", color: "bg-yellow-500" };
  return { label: "Strong", color: "bg-green-600" };
};
