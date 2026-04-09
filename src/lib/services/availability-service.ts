import { getAvailabilityForMonth } from "../availability";

export async function getAvailability() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return getAvailabilityForMonth(month);
}
