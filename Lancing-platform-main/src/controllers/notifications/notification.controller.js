import Notification from "../../models/notification.model.js";

/* GET MY NOTIFICATIONS */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* MARK AS READ */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET UNREAD COUNT */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({ unread: count });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
