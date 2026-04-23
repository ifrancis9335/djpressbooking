import { getChatRoute, postChatRoute } from "../../../lib/chat/service";

export const runtime = "nodejs";

export const GET = getChatRoute;
export const POST = postChatRoute;