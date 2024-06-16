import { gql, request } from "graphql-request";
import { getUserVerifiableURI } from "./contracts/up.js";
import { GRAPHQL_SERVER_ADDRESS } from "./serverAddress.js";

import { getLSP4Metadata } from "./models/LSP4Metadata.js";
import { getLSP3Profile } from "./models/LSP3Profile.js";
import { getLSP4Fellowship } from "./models/LSP4Fellowship.js";

import { getDeity } from "./abis/controllers/getDeity.js";
import { getFellowship } from "./abis/controllers/getFellowship.js";
import { getUser } from "./abis/controllers/getUser.js";

import { ethers } from "ethers";

export const resolvers = {
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
      console.log("owner", (await backerBuckLoader.load(id)).owner);
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
};
