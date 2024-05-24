import { gql, request } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "../../serverAddress.js";
import { getUserVerifiableURI } from "../../contracts/up.js";

const userCache = new Map();

export const getUser = async (id) => {
  const cachedUser = userCache.get(id);

  if (cachedUser && cachedUser.validTill > new Date()) {
    return cachedUser.data;
  } else {
    const { user: userData } = await request({
      url: GRAPHQL_SERVER_ADDRESS,
      document: gql`
        query user($id: ID!) {
          user(id: $id) {
            id
            backerBucks {
              id
              fellowship {
                id
              }
              owner {
                id
              }
              amount
            }
            fellowships {
              id
            }
            deities {
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

    const user = userData ? userData : { id, backerBucks: [] };

    const verifiableURI = await getUserVerifiableURI(id);

    //console.log("here", verifiableURI);

    userCache.set(id, { data: { verifiableURI, ...user }, validTill });

    return { verifiableURI, ...user };
  }
};
