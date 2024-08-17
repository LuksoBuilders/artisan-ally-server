import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendWebPushNotification } from "./PushNotifications.js";

import { PubSub } from "graphql-subscriptions";

export class NotificationService {
  constructor() {
    this.pubsub = new PubSub();
  }

  async registerOrUpdateUser(address, pushSubscription = null) {
    const user = await User.findOneAndUpdate(
      { address },
      {
        address,
        ...(pushSubscription && { pushSubscription }),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    return user;
  }

  async getUser(address) {
    return await User.findOne({ address });
  }

  async processNotification(notificationData) {
    const { type, recipient, payload } = notificationData;

    // Create and save the notification
    const notification = new Notification({
      type,
      recipient,
      payload,
      seen: false,
    });
    await notification.save();

    // Send web push notification
    const user = await this.getUser(recipient);
    if (user && user.pushSubscription) {
      //  await sendWebPushNotification(user.pushSubscription, type, payload);
    }

    this.pubsub.publish("NEW_NOTIFICATION", {
      newNotification: notification,
    });
  }

  async markNotificationAsSeen(userId) {
    const notification = await Notification.updateMany(
      { recipient: userId, seen: false },
      { seen: true },
      { new: true }
    );
    return notification;
  }

  async getUserNotifications(userId, limit = 20, offset = 0) {
    return Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  getNotificationSubscription() {
    return this.pubsub.asyncIterator(["NEW_NOTIFICATION"]);
  }

  async updatePushSubscription(userId, subscription) {
    const user = await User.findByIdAndUpdate(
      userId,
      { pushSubscription: subscription },
      { new: true }
    );
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
