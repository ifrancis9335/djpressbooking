import { getPublicSiteData } from "../../lib/site-settings";
import {
  getGalleryItems,
  getPackageItems,
  getReviewItems,
  getServiceItems
} from "../../lib/content-items";

export async function getPublicViewModel() {
  const siteContent = await getPublicSiteData();

  return {
    gallery: getGalleryItems(siteContent.siteContent),
    packages: getPackageItems(siteContent.siteContent),
    services: getServiceItems(siteContent.siteContent),
    reviews: getReviewItems(siteContent.siteContent),
    raw: siteContent
  };
}
