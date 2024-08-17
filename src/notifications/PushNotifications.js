import webpush from "web-push";
import { GRAPHQL_SERVER_ADDRESS } from "../serverAddress.js";
import { getUserVerifiableURI } from "../contracts/up.js";
import { getLSP3Profile } from "../models/LSP3Profile.js";

// Generate VAPID keys
// You should generate these once and save them securely
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log(vapidKeys.publicKey, vapidKeys.privateKey);
// Replace these with your actual VAPID keys

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:lukstaonlukso@email.com",
  publicVapidKey,
  privateVapidKey
);

export async function sendWebPushNotification(subscription, type, payload) {
  try {
    const message = await createNotificationMessage(type, payload);

    console.log(subscription, message);

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: message.title,
        body: message.body,
        data: {
          type: type,
          payload: payload,
        },
      })
    );

    console.log("Web push notification sent successfully");
  } catch (error) {
    console.error("Error sending web push notification:", error);
  }
}

export async function createNotificationMessage(type, payload) {
  switch (type) {
    case "follow":
      const follower = payload[0];
      const verifiableURI = await getUserVerifiableURI(follower.toLowerCase());

      const followerLSP3Metadata = await getLSP3Profile(verifiableURI);

      return {
        title: "New Follower",
        body: `${followerLSP3Metadata.name} started following you`,
      };
    case "reply":
      return {
        title: "New Reply",
        body: `${payload[0]} replied to your post`,
      };
    case "mirror":
      return {
        title: "New Mirror",
        body: `${payload[0]} mirrored your post`,
      };
    case "tip":
      return {
        title: "New Tip",
        body: `${payload[0]} tipped you ${payload[1]} ${payload[2]}`,
      };
    default:
      return {
        title: "New Notification",
        body: "You have a new notification",
      };
  }
}
