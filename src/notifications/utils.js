export const transformNotification = (notification) => {
  const baseNotification = {
    id: notification._id.toString(),
    type: notification.type,
    recipient: { id: notification.recipient },
    seen: notification.seen,
    createdAt: notification.createdAt.toISOString(),
  };

  switch (notification.type) {
    case "follow":
      return {
        ...baseNotification,
        from: { id: notification.payload[0] },
        payload: notification.payload,
      };
    case "reply":
      return {
        ...baseNotification,
        from: { id: notification.payload[0] },
        payload: notification.payload,
      };
    // Add more cases for other notification types as needed
    default:
      return baseNotification;
  }
};
