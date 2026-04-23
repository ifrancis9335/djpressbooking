import {
  getAdminBookingMessagesRoute,
  postAdminBookingMessagesRoute
} from "../../../../../../lib/chat/thread-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = getAdminBookingMessagesRoute;
export const POST = postAdminBookingMessagesRoute;