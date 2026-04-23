import { getAvailabilityByDate, getAvailabilityForMonth } from "../availability";
import { listBlockedDates } from "../availability-db";

export const availabilityDataService = {
  getByDate: getAvailabilityByDate,
  getForMonth: getAvailabilityForMonth,
  listBlockedDates
};