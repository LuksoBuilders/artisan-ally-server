import { getUser } from "./abis/controllers/getUser.js";
import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";
import { getUserVerifiableURI } from "./contracts/up.js";

import { Notification } from "./models/Notification.js";
import { transformNotification } from "./notifications/utils.js";

//export const getUserByIds = async (ids) => {
//  return ids.map((id) => getUser(id));
//};

export const getFellowshipByIds = async (ids) => {
  const { fellowships } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query fellowships($ids: [ID!]!) {
        fellowships(where: { id_in: $ids }, first: 1000) {
          id
          name
          symbol
          address
          metadata
          endorsementAddress
          contributionAddress
          initialPrice
          priceGrowth
          currentPrice
          totalSupply
          artisan {
            id
          }
          founder {
            id
          }
          backerBucks {
            id
          }
          contributionAddress
          contributions {
            id
          }
          endorsementAddress
          endorsements {
            id
          }
          raisedAmount
          contributionAmount
          endorsementAmount
          version
          prices {
            initialPrice
            initialGrowthFactor
            eventualGrowthFactor
            diminishingFactor
          }
        }
      }
    `,
    variables: {
      ids,
    },
  });

  // Create a map of fellowship data by id
  const fellowshipMap = {};
  fellowships.forEach((fellowship) => {
    fellowshipMap[fellowship.id] = fellowship;
  });

  // Return the data in the same order as the requested ids
  return ids.map((id) => fellowshipMap[id]);
};

export const getDeityByIds = async (ids) => {
  const { deities } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query deities($ids: [ID!]!) {
        deities(where: { id_in: $ids }) {
          id
          tokenIdNumber
          metadata
          xp
          level
          systemFeeAtomCollected {
            id
            amount
          }
          owner {
            id
          }
          withdrawable
          directFee
          harvested
          tier
          slots {
            id
            index
            usedAt
          }
          portfolio {
            id
          }
        }
      }
    `,
    variables: {
      ids,
    },
  });

  // Create a map of fellowship data by id
  const deitiesMap = {};
  deities.forEach((fellowship) => {
    deitiesMap[fellowship.id] = fellowship;
  });

  // Return the data in the same order as the requested ids
  return ids.map((id) => deitiesMap[id]);
};

export const getBackerBucksByIds = async (ids) => {
  const { backerBucks } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query backerBucks($ids: [ID!]!) {
        backerBucks(where: { id_in: $ids }, first: 1000) {
          id
          amount
          owner {
            id
          }
          fellowship {
            id
          }
          purifiable
          contributions
        }
      }
    `,
    variables: {
      ids,
    },
  });

  // Create a map of fellowship data by id
  const backerBucksMap = {};
  backerBucks.forEach((fellowship) => {
    backerBucksMap[fellowship.id] = fellowship;
  });

  // Return the data in the same order as the requested ids
  return ids.map((id) => backerBucksMap[id]);
};

export const getUsersByIds = async (ids) => {
  const { users } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query users($ids: [ID!]!) {
        users(where: { id_in: $ids }, first: 1000) {
          id
          backerBucks {
            id
          }
          fellowships {
            id
          }
          deities {
            id
          }
          holyShitsBalance
          steloBalance
          bid {
            id
            amount
            maxPrice
          }
          feed {
            id
          }
          followers {
            id
          }
          followingCount
          followings {
            id
          }
          followerCount
        }
      }
    `,
    variables: {
      ids,
    },
  });

  let allUsers = [...users];

  const notIncludedUsers = ids
    .map((id) => id.toLowerCase())
    .filter((id) => !users.map((user) => user.id.toLowerCase()).includes(id));

  notIncludedUsers.forEach((userId) =>
    allUsers.push({
      id: userId,
      backerBucks: [],
      fellowships: [],
      deities: [],
      contributions: [],
      endorsements: [],
      holyShitsBalance: "0",
      steloBalance: "0",
    })
  );

  // Create a map of fellowship data by id
  const usersMap = {};
  allUsers.forEach((user) => {
    usersMap[user.id.toLowerCase()] = user;
  });

  //  console.log(usersMap);

  // Return the data in the same order as the requested ids
  return Promise.all(
    ids
      .map((id) => usersMap[id.toLowerCase()])
      .map((user) => {
        return new Promise(async (resolve, reject) => {
          const verifiableURI = await getUserVerifiableURI(user.id);

          return resolve({ verifiableURI, ...user });
        });
      })
  );
};

export const getBotBidsByIds = async (ids) => {
  const { botBids } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query botBids($ids: [ID!]!) {
        botBids(where: { id_in: $ids }, first: 1000) {
          id
          amount
          maxPrice
        }
      }
    `,
    variables: {
      ids,
    },
  });

  // Create a map of fellowship data by id
  const botBidsMap = {};
  botBids.forEach((botBid) => {
    botBidsMap[botBid.id] = botBid;
  });

  // Return the data in the same order as the requested ids
  return ids.map((id) => botBidsMap[id]);
};

export const getFeedByIds = async (ids) => {
  const { feeds } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query feeds($ids: [ID!]!) {
        feeds(where: { id_in: $ids }) {
          id
          owner {
            id
          }
          posts(where: { isDeleted: false }) {
            id
          }
          postCount
        }
      }
    `,
    variables: { ids },
  });

  const feedMap = {};
  feeds.forEach((feed) => {
    feedMap[feed.id] = feed;
  });

  return ids.map((id) => feedMap[id]);
};

export const getPostByIds = async (ids) => {
  const { posts } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query posts($ids: [ID!]!) {
        posts(where: { id_in: $ids }) {
          id
          feed {
            id
          }
          postType
          content
          creator {
            id
          }
          referenceFeed
          referencePost {
            id
          }
          isDeleted
          isStarred
          createdAt
          parents {
            id
          }
          replies(where: { isDeleted: false }) {
            id
          }
          repliesCount
          mirrors(where: { isDeleted: false }) {
            id
          }
          mirrorsCount

          tips {
            id
          }
        }
      }
    `,
    variables: { ids },
  });

  const postMap = {};
  posts.forEach((post) => {
    postMap[post.id] = post;
  });

  return ids.map((id) => postMap[id]);
};

export const getNotificationsById = async (ids) => {
  const notifications = await Notification.find({ _id: { $in: ids } });
  const notificationMap = {};
  notifications.forEach((notification) => {
    notificationMap[notification._id.toString()] =
      transformNotification(notification);
  });
  return ids.map((id) => notificationMap[id]);
};
