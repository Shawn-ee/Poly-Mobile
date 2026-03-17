const pow10 = (decimals: number) => Math.pow(10, decimals);

export const TOKEN_DECIMALS = 2;
export const SHARE_DECIMALS = 6;

export const roundTo = (value: number, decimals: number) => {
  const factor = pow10(decimals);
  return Math.round(value * factor) / factor;
};

export const floorTo = (value: number, decimals: number) => {
  const factor = pow10(decimals);
  return Math.floor(value * factor) / factor;
};

export const ceilTo = (value: number, decimals: number) => {
  const factor = pow10(decimals);
  return Math.ceil(value * factor) / factor;
};

export const roundTokenUp = (value: number) => ceilTo(value, TOKEN_DECIMALS);
export const roundTokenDown = (value: number) => floorTo(value, TOKEN_DECIMALS);
export const roundSharesDown = (value: number) => floorTo(value, SHARE_DECIMALS);
