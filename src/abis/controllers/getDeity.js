import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "../../serverAddress.js";

const deityCache = new Map();

export const getDeity = async (id) => {
  const cachedDeity = deityCache.get(id);

  if (cachedDeity && cachedDeity.validTill > new Date()) {
    return cachedDeity.data;
  } else {
    const { deity } = await request({
      url: GRAPHQL_SERVER_ADDRESS,
      document: gql`
        query deity($id: ID!) {
          deity(id: $id) {
            id
            tokenIdNumber
            metadata
            xp
            level
            owner {
              id
            }
            withdrawable
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
        id,
      },
    });

    var validTill = new Date();
    validTill.setSeconds(validTill.getSeconds() + 3);

    deityCache.set(id, { data: deity, validTill });

    return deity;
  }
};
