export const pathExists = jest.fn(() => {
  return false;
});

export const isValidVersionString = jest.fn(() => {
  return true;
});
export const getLsVersion = jest.fn();
export const getRequiredVersionRelease = jest.fn();
