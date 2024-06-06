import { getUser } from "./abis/controllers/getUser.js";
import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";
import { getUserVerifiableURI } from "./contracts/up.js";

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

  if (notIncludedUsers.length > 0) {
    console.log(
      "not included users",
      ids.length,
      ids,
      notIncludedUsers,
      users.map((user) => user.id)
    );
  }

  notIncludedUsers.forEach((userId) =>
    allUsers.push({ id: userId, backerBucks: [], fellowships: [], deities: [] })
  );

  // Create a map of fellowship data by id
  const usersMap = {};
  allUsers.forEach((user) => {
    usersMap[user.id.toLowerCase()] = user;
  });

  console.log(usersMap);

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
