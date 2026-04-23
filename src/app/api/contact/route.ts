import { getContactsRoute, postContactsRoute } from "../../../lib/data/handlers";

export const runtime = "nodejs";

export const GET = getContactsRoute;
export const POST = postContactsRoute;
