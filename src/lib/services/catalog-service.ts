import { packageAddOns, packageTiers, serviceTypes, testimonials, galleryItems, faqs, serviceArea } from "../../data/catalog";

export function getCatalogData() {
  return {
    serviceArea,
    serviceTypes,
    packageTiers,
    packageAddOns,
    testimonials,
    galleryItems,
    faqs
  };
}
