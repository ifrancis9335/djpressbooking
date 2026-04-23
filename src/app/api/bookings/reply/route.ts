import { getPublicBookingReplyRoute, postPublicBookingReplyRoute } from "../../../../lib/chat/thread-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = getPublicBookingReplyRoute;
export const POST = postPublicBookingReplyRoute;