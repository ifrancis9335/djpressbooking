function firstNonEmpty(values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

export function getCustomerAccessTokenSecret() {
  return firstNonEmpty([
    process.env.CUSTOMER_ACCESS_TOKEN_SECRET,
    process.env.BOOKING_REPLY_SECRET,
    process.env.ADMIN_API_KEY,
    process.env.ADMIN_PASSWORD
  ]);
}