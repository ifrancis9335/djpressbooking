import { NextResponse } from "next/server";
import { getCatalogData } from "../../../lib/services/catalog-service";

export async function GET() {
  const { packageTiers, packageAddOns } = getCatalogData();
  return NextResponse.json({ packages: packageTiers, addOns: packageAddOns });
}
