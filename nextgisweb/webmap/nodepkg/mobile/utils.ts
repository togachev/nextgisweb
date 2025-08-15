export const getNavigatorInstance = () => {
  if (typeof window !== 'undefined') {
    if (window.navigator || navigator) {
      return window.navigator || navigator;
    }
  }

  return false;
};

export const isIOS13Check = (type) => {
  const nav = getNavigatorInstance();
  return (
    nav &&
    nav.platform &&
    (nav.platform.indexOf(type) !== -1 ||
      (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1 && !window.MSStream))
  );
};