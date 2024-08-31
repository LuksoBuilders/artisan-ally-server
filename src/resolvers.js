import "dotenv/config";

import { gql, request } from "graphql-request";
import { withFilter } from "graphql-subscriptions";

import { getUserVerifiableURI } from "./contracts/up.js";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";

import { getLSP4Metadata } from "./models/LSP4Metadata.js";
import { getLSP3Profile } from "./models/LSP3Profile.js";
import { getLSP4Fellowship } from "./models/LSP4Fellowship.js";
import { getPostContent } from "./models/PostContent.js";

import { getDeity } from "./abis/controllers/getDeity.js";
import { getFellowship } from "./abis/controllers/getFellowship.js";
import { getUser } from "./abis/controllers/getUser.js";

import { ethers } from "ethers";

import { uploadJson } from "./ipfs/uploadJson.js";

import { NotificationService } from "./notifications/NotificationService.js";

import { Notification } from "./models/Notification.js";

const notificationService = new NotificationService();

const randomedFollowers = [
  "0x9901d6670e465e174ac7d4c5cfa9a4a78f6d8e21",
  "0x64318cddf0f87dba45be181584c54ae955abf2d2",
  "0xab5773b774c532aad8e60b088eb77c7cc937448a",
  "0x64318cddf0f87dba45be181584c54ae955abf2d2",
  "0xf740391144cf5cdc65e2e520808575c023516970",
  "0xcecd1798420a533c9627770e052f49aa127c3b3b",
];

const getRandomFollower = () => {
  const randomIndex = Math.floor(Math.random() * randomedFollowers.length);
  return randomedFollowers[randomIndex].toLowerCase();
};

const sendTestNotification = () => {
  setInterval(async () => {
    console.log("sending a test notification");
    notificationService.processNotification({
      type: "follow",
      recipient: "0x55E0F69F4b89d873f1d72449954F8F83C867be97".toLowerCase(),
      payload: [getRandomFollower()],
    });
  }, 5000);
};

//sendTestNotification();

const flaggedUsers = ["0x3f2058f7e0105972066c1d4d3803adf0df28c42b"];

function parseVerifiableURI(verifiableURI) {
  const stripped = verifiableURI.startsWith("0x")
    ? verifiableURI.slice(2)
    : verifiableURI;

  const verificationMethod = "0x" + stripped.slice(4, 12);
  const verificationDataLength = parseInt(stripped.slice(12, 16), 16);
  const verificationData =
    "0x" + stripped.slice(16, 16 + verificationDataLength * 2);
  const encodedURI = stripped.slice(16 + verificationDataLength * 2);

  return {
    verificationMethod,
    verificationData,
    uri: encodedURI ? ethers.utils.toUtf8String("0x" + encodedURI) : "",
  };
}

export const resolvers = {
  Subscription: {
    newNotification: {
      subscribe: withFilter(
        () => notificationService.pubsub.asyncIterator(["NEW_NOTIFICATION"]),
        (payload, variables) => {
          console.log(
            "a subscription happened: ",
            variables.userId.toLowerCase()
          );
          return (
            payload.newNotification.recipient === variables.userId.toLowerCase()
          );
        }
      ),
      resolve: (payload) => {
        // Extract just the id from the notification and return it in an object
        return { id: payload.newNotification._id.toString() };
      },
    },
  },

  Mutation: {
    uploadPostContent: async (_, { body }) => {
      return await uploadJson(body);
    },

    registerOrUpdateUser: async (_, { input }) => {
      const { address, pushSubscription } = input;

      try {
        const user = await notificationService.registerOrUpdateUser(
          address,
          pushSubscription
        );
        return "success";
      } catch (error) {
        console.error("Error in registerOrUpdateUser:", error);
        throw new Error("Failed to register or update user");
      }
    },

    seen: async (_, { userId }) => {
      await notificationService.markNotificationAsSeen(userId);
      return "done";
    },
  },

  Query: {
    globalVars: async (_) => {
      try {
        const globalV = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query users {
                globalVars(id: "0x00000000") {
                  totalFeeCollected
                  totalRaisedAmount
                  divineDungDepotBalance
                }
              }
            `,
          })
        ).globalVars;

        return globalV;
      } catch (err) {
        console.error(err);
      }
    },

    user: async (_, { userAddress }) => {
      return {
        id: userAddress,
      };
    },

    users: async () => {
      try {
        const targetUsers = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query users {
                users(first: 1000) {
                  id
                }
              }
            `,
          })
        ).users;

        return targetUsers;
      } catch (err) {
        console.error(err);
      }
    },

    botBids: async () => {
      try {
        const targetBotBids = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query botBids {
                botBids(first: 1000) {
                  id
                }
              }
            `,
          })
        ).botBids;

        return targetBotBids;
      } catch (err) {
        console.error(err);
      }
    },

    rockStars: async () => {
      try {
        console.log("start of the query");
        const targetUsers = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query users {
                users(first: 1000, where: { steloBalance_gte: 1 }) {
                  id
                }
              }
            `,
          })
        ).users;

        console.log("end of the query");

        return targetUsers;
      } catch (err) {
        console.error(err);
      }
    },

    userDeities: async (_, { userAddress }) => {
      try {
        const targetDeities = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query deities($owner: String) {
                deities(where: { owner: $owner }) {
                  id
                }
              }
            `,
            variables: {
              owner: userAddress,
            },
          })
        ).deities;

        return targetDeities;
      } catch (err) {
        console.error(err);
      }
    },

    userFellowships: async (_, { userAddress }) => {
      try {
        const targetFellowships = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query fellowships($artisan: String) {
                fellowships(where: { artisan: $artisan }) {
                  id
                }
              }
            `,
            variables: {
              artisan: userAddress,
            },
          })
        ).fellowships;

        return targetFellowships.map((fellowship) => ({
          ...fellowship,
          // metadata: getLSP4Metadata(deity.metadata),
        }));

        //return [];
      } catch (err) {
        console.error(err);
      }
    },

    fellowship: async (_, { id }) => {
      try {
        return { id };
        //return [];
      } catch (err) {
        console.error(err);
      }
    },

    fellowships: async () => {
      try {
        const targetFellowships = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              {
                fellowships(where: { metadata_not: null }) {
                  id
                }
              }
            `,
            variables: {},
          })
        ).fellowships;

        return targetFellowships;
        //return [];
      } catch (err) {
        console.error(err);
      }
    },

    deities: async (_, {}) => {
      try {
        const targetDeities = (
          await request({
            url: GRAPHQL_SERVER_ADDRESS,
            document: gql`
              query {
                deities {
                  id
                }
              }
            `,
          })
        ).deities;
        return targetDeities;
      } catch (err) {
        console.error(err);
      }
    },

    deity: async (_, { deityId }) => {
      return {
        id: deityId,
      };
    },

    feed: async (_, { id }) => {
      return { id };
    },

    post: async (_, { id }) => {
      return { id };
    },

    homePagePosts: async (_, { limit, offset, userAddress }) => {
      try {
        let targetPosts;

        if (userAddress) {
          const user = (
            await request({
              url: GRAPHQL_SERVER_ADDRESS,
              document: gql`
                query user($userId: ID!) {
                  user(id: $userId) {
                    id
                    followings {
                      id
                    }
                  }
                }
              `,
              variables: {
                userId: userAddress,
              },
            })
          ).user;

          console.log(user);

          targetPosts = (
            await request({
              url: GRAPHQL_SERVER_ADDRESS,
              document: gql`
                query posts($creators: [String!]!) {
                  posts(
                    where: {
                      or: [
                        {
                          creator_in: $creators
                          isDeleted: false
                          referencePost: null
                        }
                        {
                          isStarred: true
                          isDeleted: false
                          referencePost: null
                        }
                      ]
                    }
                    orderBy: createdAt
                    orderDirection: desc
                  ) {
                    id
                  }
                }
              `,
              variables: {
                owner: userAddress,
                creators: [
                  userAddress,
                  ...user.followings.map((follower) => follower.id),
                ],
              },
            })
          ).posts;
        } else {
          targetPosts = (
            await request({
              url: GRAPHQL_SERVER_ADDRESS,
              document: gql`
                query posts {
                  posts(
                    where: {
                      isStarred: true
                      isDeleted: false
                      referencePost: null
                    }
                    orderBy: createdAt
                    orderDirection: desc
                  ) {
                    id
                  }
                }
              `,
              variables: {
                owner: userAddress,
              },
            })
          ).posts;
        }
        const blockedPosts = [
          "0xc8acea6b01d10d37ea3704cd406d0ea11000b862-0x0000000000000000000000000000000000000000000000000000000000000000",
          "0xc8acea6b01d10d37ea3704cd406d0ea11000b862-0x0000000000000000000000000000000000000000000000000000000000000001",
        ];

        const blockedUsers = ["0xc8acea6b01d10d37ea3704cd406d0ea11000b862"];

        return targetPosts.filter((tgPost) => {
          const userId = tgPost.id.split("-")[0];

          const isNotBlockedPost = !blockedPosts.includes(tgPost.id);

          // Check if the post's author is not in blockedUsers
          const isNotBlockedUser = !blockedUsers.includes(userId);

          return isNotBlockedPost && isNotBlockedUser;
        });
      } catch (err) {
        console.error(err);
      }
    },
  },

  User: {
    id: async ({ id }) => {
      return id;
    },
    profile: async ({ id }, _, { userLoader }) => {
      const lsp3Metadata = await getLSP3Profile(
        (
          await userLoader.load(id)
        ).verifiableURI
      );

      return lsp3Metadata;
    },
    backerBucks: async ({ id }, _, { userLoader }) => {
      return (await userLoader.load(id)).backerBucks;
    },
    fellowships: async ({ id }, _, { userLoader }) => {
      return (await userLoader.load(id)).fellowships;
    },
    deities: async ({ id }, _, { userLoader }) => {
      return (await userLoader.load(id)).deities;
    },
    holyShitsBalance: async ({ id }, _, { userLoader }) => {
      return (await userLoader.load(id)).holyShitsBalance;
    },
    steloBalance: async ({ id }, _, { userLoader }) => {
      return (await userLoader.load(id)).steloBalance;
    },
    bid: async ({ id }, _, { userLoader }) => {
      return { ...(await userLoader.load(id)).bid, user: id };
    },
    feed: async ({ id }, _, { userLoader }) => {
      const user = await userLoader.load(id);
      return user.feed ? { id: user.feed.id } : null;
    },
    followers: async ({ id }, _, { userLoader }) => {
      const user = await userLoader.load(id);
      return user.followers;
    },
    followerCount: async ({ id }, _, { userLoader }) => {
      const user = await userLoader.load(id);
      return user.followerCount;
    },
    followings: async ({ id }, _, { userLoader }) => {
      const user = await userLoader.load(id);
      return user.followings;
    },
    followingCount: async ({ id }, _, { userLoader }) => {
      const user = await userLoader.load(id);
      return user.followingCount;
    },
    notifications: async ({ id }, { limit = 10, offset = 0 }) => {
      console.log("getting notifs");

      const query = { recipient: id };

      const notifications = await Notification.find(query)
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit + 1); // Fetch one extra to check if there's more

      const hasMore = notifications.length > limit;
      const paginatedNotifications = notifications.slice(0, limit);

      console.log("mid notifs");

      const unseenCount = await Notification.countDocuments({
        recipient: id,
        seen: false,
      });

      console.log("got the notif");

      return {
        notifications: paginatedNotifications.map((notif) => ({
          id: String(notif._id),
        })),
        unseenCount,
        hasMore,
      };
    },
    flagged: async ({ id }) => {
      return flaggedUsers
        .map((flaggedUser) => flaggedUser.toLowerCase())
        .includes(id.toLowerCase());
    },
  },

  Notification: {
    id: ({ id }, _, { notificationLoader }) => {
      return id;
    },
    type: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.type;
    },
    recipient: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.recipient;
    },
    from: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.from;
    },
    payload: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.payload;
    },
    seen: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.seen;
    },
    createdAt: async ({ id }, _, { notificationLoader }) => {
      const notification = await notificationLoader.load(id);
      return notification.createdAt;
    },
  },

  Deity: {
    id: async ({ id }, _, { deitiesLoader }) => {
      return id;
    },

    tokenIdNumber: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).tokenIdNumber;
    },
    tier: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).tier;
    },
    metadata: async ({ id }, _, { deitiesLoader }) => {
      return getLSP4Metadata((await deitiesLoader.load(id)).metadata);
    },
    level: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).level;
    },
    xp: async ({ id }, _, { deitiesLoader }) => {
      const rawXp = (await deitiesLoader.load(id)).xp;
      return Number(ethers.utils.formatUnits(rawXp, 15)).toFixed(0);
    },
    owner: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).owner;
    },
    withdrawable: async ({ id }, _, { deitiesLoader }) => {
      const deity = await deitiesLoader.load(id);

      const getDeityFeePercent = () => {
        switch (deity.tier) {
          case "S":
            return 100;
          case "A":
            return 75;
          case "B":
            return 50;
          case "C":
            return 25;
        }
      };

      const directFee = ethers.BigNumber.from(deity.directFee);
      const passiveFee = ethers.BigNumber.from(
        deity.systemFeeAtomCollected.amount
      ).mul(getDeityFeePercent());

      const harvested = ethers.BigNumber.from(deity.harvested);

      return directFee.add(passiveFee).sub(harvested).toString();
    },
    slots: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).slots;
    },
    portfolio: async ({ id }, _, { deitiesLoader }) => {
      return (await deitiesLoader.load(id)).portfolio;
    },
  },

  Fellowship: {
    id: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).id;
    },
    name: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).name;
    },
    symbol: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).symbol;
    },
    address: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).address;
    },
    metadata: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).metadata;
    },
    info: async ({ id }, _, { fellowshipLoader }) => {
      try {
        if (!(await fellowshipLoader.load(id)).metadata) return null;
        return await getLSP4Fellowship(
          (
            await fellowshipLoader.load(id)
          ).metadata
        );
      } catch (err) {
        console.error(err);
        return {
          description: "",
          assets: [],
          images: [],
          links: [],
          attributes: [],
        };
        throw err;
      }
    },
    contributionAddress: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).contributionAddress;
    },
    endorsementAddress: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).endorsementAddress;
    },
    priceGrowth: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).priceGrowth;
    },
    initialPrice: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).initialPrice;
    },
    currentPrice: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).currentPrice;
    },
    totalSupply: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).totalSupply;
    },
    backerBucks: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).backerBucks;
    },
    endorsements: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).endorsements;
    },
    contributions: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).contributions;
    },
    founder: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).founder;
    },
    artisan: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).artisan;
    },
    raisedAmount: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).raisedAmount;
    },
    contributionAmount: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).contributionAmount;
    },
    endorsementAmount: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).endorsementAmount;
    },
    version: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).version;
    },
    prices: async ({ id }, _, { fellowshipLoader }) => {
      return (await fellowshipLoader.load(id)).prices;
    },
  },

  BackerBuck: {
    id: async ({ id }, _, { backerBuckLoader }) => {
      return id;
    },
    amount: async ({ id }, _, { backerBuckLoader }) => {
      return (await backerBuckLoader.load(id)).amount;
    },
    owner: async ({ id }, _, { backerBuckLoader }) => {
      return (await backerBuckLoader.load(id)).owner;
    },
    fellowship: async ({ id }, _, { backerBuckLoader }) => {
      return (await backerBuckLoader.load(id)).fellowship;
    },
    contributions: async ({ id }, _, { backerBuckLoader }) => {
      return (await backerBuckLoader.load(id)).contributions;
    },
    purifiable: async ({ id }, _, { backerBuckLoader }) => {
      return (await backerBuckLoader.load(id)).purifiable;
    },
  },

  Bid: {
    id: async ({ id }, _, { botBidsLoader }) => {
      return id;
    },
    amount: async ({ id }, _, { botBidsLoader }) => {
      return (await botBidsLoader.load(id)).amount;
    },
    maxPrice: async ({ id }, _, { botBidsLoader }) => {
      return (await botBidsLoader.load(id)).maxPrice;
    },
    user: async ({ id }, _, { botBidsLoader }) => {
      return { id };
    },
  },

  Feed: {
    owner: async ({ id }, _, { feedLoader }) => {
      const feed = await feedLoader.load(id);
      return { id: feed.owner.id };
    },
    posts: async ({ id }, _, { feedLoader }) => {
      const feed = await feedLoader.load(id);
      return feed.posts.map((post) => ({ id: post.id }));
    },
    postCount: async ({ id }, _, { feedLoader }) => {
      const feed = await feedLoader.load(id);
      return feed.postCount.toString();
    },
  },

  Post: {
    feed: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return { id: post.feed.id };
    },
    creator: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return { id: post.creator.id };
    },
    content: async ({ id }, _, { postLoader }) => {
      const startTime = new Date();
      const logWithTime = (message) => {
        const elapsedMs = new Date() - startTime;
        console.log(`${message} (${elapsedMs}ms after start)`);
      };

      //logWithTime('start ofgetting the post content')
      const post = await postLoader.load(id);
      //logWithTime('post indexed data loaded')
      const postContent = await getPostContent(post.content);
      //logWithTime('post content loaded')
      return postContent;
    },
    postType: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.postType;
    },
    isDeleted: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.isDeleted;
    },
    isStarred: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.isStarred;
    },
    createdAt: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.createdAt;
    },
    referencePost: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.referencePost ? { id: post.referencePost.id } : null;
    },
    parents: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.parents.map((reply) => ({ id: reply.id }));
    },
    replies: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.replies.map((reply) => ({ id: reply.id }));
    },
    repliesCount: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.repliesCount;
    },
    mirrors: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.mirrors.map((mirror) => ({ id: mirror.id }));
    },
    mirrorsCount: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.mirrorsCount;
    },
    tips: async ({ id }, _, { postLoader }) => {
      const post = await postLoader.load(id);
      return post.tips.map((tip) => ({ id: tip.id }));
    },
  },
};
