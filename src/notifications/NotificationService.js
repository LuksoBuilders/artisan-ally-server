import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendWebPushNotification } from "./PushNotifications.js";
import { request, gql } from "graphql-request";

import { PubSub } from "graphql-subscriptions";
import { GRAPHQL_SERVER_ADDRESS } from "../serverAddress.js";
import fs from 'fs/promises';
import path from 'path';

const TIMESTAMP_FILE = path.join(process.cwd(), "last_processed_timestamp.txt");

export class NotificationService {
  constructor() {
    this.pubsub = new PubSub();
    this.lastProcessedTimestamp = "0"; // Initialize with '0' to fetch all alerts initially
    this.isInitialSyncComplete = false;
    this.initializeLastProcessedTimestamp();
  }

  async initializeLastProcessedTimestamp() {
    try {
      const timestamp = await fs.readFile(TIMESTAMP_FILE, "utf8");
      this.lastProcessedTimestamp = timestamp.trim();
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist, use default value
        this.lastProcessedTimestamp = "0";
      } else {
        console.error("Error reading timestamp file:", error);
      }
    }
    this.startAlertProcessing();
  }

  async saveLastProcessedTimestamp() {
    try {
      await fs.writeFile(TIMESTAMP_FILE, this.lastProcessedTimestamp);
    } catch (error) {
      console.error("Error saving timestamp:", error);
    }
  }

  async startAlertProcessing() {
    // Initial sync
    await this.initialSync();

    // Continuous processing
    setInterval(() => this.processNewAlerts(), 10000); // Every 10 seconds
  }

  async initialSync() {
    let hasMore = true;
    while (hasMore) {
      const alerts = await this.fetchAlerts(this.lastProcessedTimestamp, 100);
      if (alerts.length === 0) {
        hasMore = false;
        this.isInitialSyncComplete = true;
      } else {
        for (const alert of alerts) {
          await this.processAlert(alert);
        }
        this.lastProcessedTimestamp = (
          parseInt(alerts[alerts.length - 1].createdAt) + 1
        ).toString();
        await this.saveLastProcessedTimestamp();
      }
    }
    console.log("Initial sync completed");
  }

  async processNewAlerts() {
    if (!this.isInitialSyncComplete) return;

    const alerts = await this.fetchAlerts(this.lastProcessedTimestamp, 100);
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
    if (alerts.length > 0) {
      this.lastProcessedTimestamp = (
        parseInt(alerts[alerts.length - 1].createdAt) + 1
      ).toString();
      await this.saveLastProcessedTimestamp();
    }
  }

  async fetchAlerts(fromTimestamp, limit) {
    const { alerts } = await request({
      url: GRAPHQL_SERVER_ADDRESS,
      document: gql`
        query alerts($fromTimestamp: String!, $limit: Int!) {
          alerts(
            where: { createdAt_gt: $fromTimestamp }
            first: $limit
            orderBy: createdAt
            orderDirection: asc
          ) {
            id
            type
            recipient {
              id
            }
            payload
            createdAt
          }
        }
      `,
      variables: { fromTimestamp, limit },
    });
    return alerts;
  }

  async processAlert(alert) {
    const notificationData = {
      type: alert.type,
      recipient: alert.recipient.id,
      payload: alert.payload,
      createdAt: new Date(Number(alert.createdAt) *(1000))
    };
    await this.processNotification(notificationData);
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
    const { type, recipient, payload, createdAt } = notificationData;

    console.log(type, recipient, payload);

    // Create and save the notification
    const notification = new Notification({
      type,
      recipient,
      payload,
      seen: false,
      createdAt
    });
    await notification.save();

    // Send web push notification
    const user = await this.getUser(recipient);
    if (user && user.pushSubscription) {
      await sendWebPushNotification(user.pushSubscription, type, payload);
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

  async clearAllNotificationsForTesting() {
    try {
      await Notification.deleteMany({});
      this.lastProcessedTimestamp = "0";
      await this.saveLastProcessedTimestamp();
      console.log("All notifications cleared and timestamp reset for testing");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }
}
