export function getErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}
