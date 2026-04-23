import { createContactMessage, getContactMessages } from "../services/contact-service";

export const contactDataService = {
  create: createContactMessage,
  list: getContactMessages
};