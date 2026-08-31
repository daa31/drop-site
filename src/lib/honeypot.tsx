/* Honeypot spam protection: a hidden field bots tend to auto-fill.
   A genuine user never sees/interacts with it, so any non-empty value = bot.
   The name is deliberately generic and the field is moved off-screen + aria-hidden. */
export const HONEYPOT_NAME = "website";

export function honeypotField(name = HONEYPOT_NAME) {
  return (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      name={name}
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
    />
  );
}

export function isHoneypotFilled(body: Record<string, unknown>, name = HONEYPOT_NAME): boolean {
  const value = body[name];
  return typeof value === "string" && value.trim().length > 0;
}
