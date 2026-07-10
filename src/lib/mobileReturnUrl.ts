export const isAllowedMobileReturnUrl = (value: string | URL, nodeEnv = process.env.NODE_ENV) => {
  try {
    const url = typeof value === "string" ? new URL(value) : value;
    if (url.protocol === "holiwyn:") return true;
    if (nodeEnv !== "production" && (url.protocol === "exp:" || url.protocol === "exps:")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
