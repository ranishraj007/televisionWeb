// Frontend demo accounts are public in the browser bundle. Never use real passwords here.
export const demoAccounts = [
  { username: "admin", password: "Admin@Admin" },
  { username: "jenish", password: "Jenish@123" },
  { username: "bishal", password: "Bishal@123" },
  { username: "bickey", password: "Bickey@123" },
  { username: "nijgoll", password: "Nijgoll@123" },
  { username: "baba", password: "Baba@123" },
];
export const sessionKey = "golltv-demo-session";
export function validateCredentials(username: string, password: string) {
  return (
    demoAccounts.find(
      (account) =>
        account.username === username.trim() && account.password === password,
    )?.username ?? null
  );
}
export function safeDestination(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\x00-\x20]/.test(value) &&
    value.split(/[?#]/)[0] !== "/login"
    ? value
    : "/";
}
