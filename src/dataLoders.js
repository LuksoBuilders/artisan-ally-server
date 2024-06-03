import { getUser } from "./abis/controllers/getUser.js";
import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";

export const getUserByIds = async (ids) => {
  return ids.map((id) => getUser(id));
};

export const getFellowshipByIds = async (ids) => {
  const { fellowships } = await request({
    url: GRAPHQL_SERVER_ADDRESS,
    document: gql`
      query fellowships($ids: [ID!]!) {
        fellowships(where: { id_in: $ids }) {
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
            amount
            owner {
              id
            }
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
        }
      }
    `,
    variables: {
      ids,
    },
  });

  return fellowships;
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

  return deities;
};
