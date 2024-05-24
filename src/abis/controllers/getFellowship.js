import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "../../serverAddress.js";

const fellowshipCache = new Map();

export const getFellowship = async (id) => {
  const cachedFellowships = fellowshipCache.get(id);

  if (cachedFellowships && cachedFellowships.validTill > new Date()) {
    return cachedFellowships.data;
  } else {
    const { fellowship } = await request({
      url: GRAPHQL_SERVER_ADDRESS,
      document: gql`
        query fellowship($id: ID!) {
          fellowship(id: $id) {
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
          }
        }
      `,
      variables: {
        id,
      },
    });

    var validTill = new Date();
    validTill.setSeconds(validTill.getSeconds() + 2);

    fellowshipCache.set(id, { data: fellowship, validTill });

    return fellowship;
  }
};
