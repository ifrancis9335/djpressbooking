import { getBookingsRoute, patchBookingsRoute, postBookingsRoute } from "../../../../lib/data/handlers";

export const runtime = "nodejs";

export const GET = getBookingsRoute;
export const PATCH = patchBookingsRoute;
export const POST = postBookingsRoute;