import { promises as fs } from "fs";
import path from "path";
import { isoDateSchema } from "./validators/api";

const unavailableDatesPath = path.join(process.cwd(), "data", "unavailableDates.json");

function normalizeDates(values: string[]) {
  const valid = values.filter((value) => isoDateSchema.safeParse(value).success);
  return Array.from(new Set(valid)).sort();
}

export async function getUnavailableDates(): Promise<string[]> {
  try {
    const raw = await fs.readFile(unavailableDatesPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeDates(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return [];
  }
}

async function writeUnavailableDates(dates: string[]) {
  const normalized = normalizeDates(dates);
  await fs.writeFile(unavailableDatesPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

export async function addUnavailableDate(date: string) {
  const dates = await getUnavailableDates();
  return writeUnavailableDates([...dates, date]);
}

export async function removeUnavailableDate(date: string) {
  const dates = await getUnavailableDates();
  return writeUnavailableDates(dates.filter((value) => value !== date));
}
