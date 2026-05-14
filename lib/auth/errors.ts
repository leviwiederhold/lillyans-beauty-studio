type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

export function getAuthErrorMessage(error: unknown) {
  const authError = error as AuthErrorLike;
  const message = authError?.message || "";

  if (authError?.status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }

  if (authError?.status === 500 || message.includes("500")) {
    return "Signup is not configured correctly yet. Please contact the studio.";
  }

  if (message.includes("already registered") || message.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  return message || "Something went wrong. Please try again.";
}
