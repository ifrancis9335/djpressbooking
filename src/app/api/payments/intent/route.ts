import { getPaymentIntentRoute, postPaymentIntentRoute } from "../../../../lib/payments/service";

export const runtime = "nodejs";

export const GET = getPaymentIntentRoute;
export const POST = postPaymentIntentRoute;