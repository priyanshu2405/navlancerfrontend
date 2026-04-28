import Notification from "../models/notification.model.js";

export const createNotification = async (
  userId,
  type,
  message,
  relatedId
) => {
  await Notification.create({
    userId,
    type,
    message,
    relatedId,
  });
};
