export const tokenStorage = {
  get: () => localStorage.getItem('access_token'),
  set: (token) => localStorage.setItem('access_token', token),
  clear: () => localStorage.removeItem('access_token'),
};
