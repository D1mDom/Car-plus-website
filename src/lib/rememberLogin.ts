const WEBSITE_EMAIL = "carplus-remember-email";
const WEBSITE_FLAG = "carplus-remember-me";
const ADMIN_EMAIL = "carplus-admin-remember-email";
const ADMIN_FLAG = "carplus-admin-remember-me";

type RememberKind = "website" | "admin";

const keys = (kind: RememberKind) =>
  kind === "admin"
    ? { email: ADMIN_EMAIL, flag: ADMIN_FLAG }
    : { email: WEBSITE_EMAIL, flag: WEBSITE_FLAG };

export const loadRememberedLogin = (kind: RememberKind): { email: string; remember: boolean } => {
  try {
    const { email: emailKey, flag: flagKey } = keys(kind);
    const email = localStorage.getItem(emailKey)?.trim() ?? "";
    const flag = localStorage.getItem(flagKey);
    const remember = flag === null ? Boolean(email) : flag === "1";
    return { email: remember ? email : "", remember: flag === null ? true : remember };
  } catch {
    return { email: "", remember: true };
  }
};

export const persistRememberedLogin = (kind: RememberKind, email: string, remember: boolean) => {
  try {
    const { email: emailKey, flag: flagKey } = keys(kind);
    localStorage.setItem(flagKey, remember ? "1" : "0");
    if (remember && email.trim()) localStorage.setItem(emailKey, email.trim());
    else localStorage.removeItem(emailKey);
  } catch {
    /* ignore private-mode storage errors */
  }
};
