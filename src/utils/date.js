function isValidDate(str) {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(str);
}
function parseDate(str) {
  const [d, m, y] = str.split('.').map(Number);
  return new Date(y, m - 1, d);
}
function getRentalDays(start, end) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end - start) / ms));
}
module.exports = { isValidDate, parseDate, getRentalDays };
