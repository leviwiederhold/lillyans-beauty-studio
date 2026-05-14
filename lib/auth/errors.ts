type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

export function getAuthErrorMessage(error: unknown) {
  const authError = error as AuthErrorLike;
  const message = authError?.message || "";
  const code = authError?.code || "";
  const lower = `${message} ${code}`.toLowerCase();

  if (authError?.status === 429 || lower.includes("429") || lower.includes("rate limit")) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }

  if (authError?.status === 500 || lower.includes("500")) {
    return "Signup is not configured correctly yet. Please contact the studio.";
  }

  if (lower.includes("otp_expired") || lower.includes("expired")) {
    return "This verification link is expired or already used. Request a new verification email.";
  }

  if (lower.includes("already registered") || lower.includes("user already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  return message || "Something went wrong. Please try again.";
}
