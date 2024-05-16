import { gql, request } from "graphql-request";
import { getUserVerifiableURI } from "./contracts/up.js";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";

import { getLSP4Metadata } from "./models/LSP4Metadata.js";
import { getLSP3Profile } from "./models/LSP3Profile.js";
import { getLSP4Fellowship } from "./models/LSP4Fellowship.js";

import { getDeity } from "./abis/controllers/getDeity.js";
import { getFellowship } from "./abis/controllers/getFellowship.js";
import { getUser } from "./abis/controllers/getUser.js";

export const resolvers = {
  Query: {
    user: async (_, { userAddress }) => {
      return {
        id: userAddress,
      };
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
                  name
                  metadata
                  symbol
                  endorsementAddress
                  contributionAddress
                  initialPrice
                  priceGrowth
                  currentPrice
                  totalSupply
                  artisan {
                    id
                  }
                }
              }
            `,
            variables: {},
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
  },

  User: {
    id: async ({ id }) => {
      return (await getUser(id)).id;
    },
    profile: async ({ id }) => {
      const lsp3Metadata = await getLSP3Profile(
        (
          await getUser(id)
        ).verifiableURI
      );

      return lsp3Metadata;
    },
    backerBucks: async ({ id }) => {
      return (await getUser(id)).backerBucks;
    },
  },

  Deity: {
    id: async ({ id }) => {
      return (await getDeity(id)).id;
    },

    tokenIdNumber: async ({ id }) => {
      return (await getDeity(id)).tokenIdNumber;
    },
    tier: async ({ id }) => {
      return (await getDeity(id)).tier;
    },
    metadata: async ({ id }) => {
      return getLSP4Metadata((await getDeity(id)).metadata);
    },
    level: async ({ id }) => {
      return (await getDeity(id)).level;
    },
    xp: async ({ id }) => {
      return (await getDeity(id)).xp;
    },
    owner: async ({ id }) => {
      return (await getDeity(id)).owner;
    },
    withdrawable: async ({ id }) => {
      return (await getDeity(id)).withdrawable;
    },
    slots: async ({ id }) => {
      return (await getDeity(id)).slots;
    },
    portfolio: async ({ id }) => {
      return (await getDeity(id)).portfolio;
    },
  },

  Fellowship: {
    id: async ({ id }) => {
      return (await getFellowship(id)).id;
    },
    name: async ({ id }) => {
      return (await getFellowship(id)).name;
    },
    symbol: async ({ id }) => {
      return (await getFellowship(id)).symbol;
    },
    address: async ({ id }) => {
      return (await getFellowship(id)).address;
    },
    metadata: async ({ id }) => {
      return (await getFellowship(id)).metadata;
    },
    info: async ({ id }) => {
      if (!(await getFellowship(id)).metadata) return null;
      return await getLSP4Fellowship((await getFellowship(id)).metadata);
    },
    contributionAddress: async ({ id }) => {
      return (await getFellowship(id)).contributionAddress;
    },
    endorsementAddress: async ({ id }) => {
      return (await getFellowship(id)).endorsementAddress;
    },
    priceGrowth: async ({ id }) => {
      return (await getFellowship(id)).priceGrowth;
    },
    initialPrice: async ({ id }) => {
      return (await getFellowship(id)).initialPrice;
    },
    currentPrice: async ({ id }) => {
      return (await getFellowship(id)).currentPrice;
    },
    totalSupply: async ({ id }) => {
      return (await getFellowship(id)).totalSupply;
    },
    backerBucks: async ({ id }) => {
      return (await getFellowship(id)).backerBucks;
    },
    endorsements: async ({ id }) => {
      return (await getFellowship(id)).endorsements;
    },
    contributions: async ({ id }) => {
      return (await getFellowship(id)).contributions;
    },
    founder: async ({ id }) => {
      return (await getFellowship(id)).founder;
    },
    artisan: async ({ id }) => {
      return (await getFellowship(id)).artisan;
    },
  },
};
