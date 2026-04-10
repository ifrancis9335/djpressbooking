import { packageAddOns, serviceTypes, testimonials, galleryItems, faqs } from "../../data/catalog";
import { getPublicSiteData } from "../site-settings";

export async function getCatalogData() {
  const { packageTiers, siteContact } = await getPublicSiteData();

  return {
    serviceArea: siteContact.serviceArea,
    serviceTypes,
    packageTiers,
    packageAddOns,
    testimonials,
    galleryItems,
    faqs
  };
}
