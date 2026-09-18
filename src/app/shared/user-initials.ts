/** First two characters of an email, uppercased — used for the sidebar avatar. */
export function userInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
