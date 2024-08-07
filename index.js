import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./src/typeDefs.js";
import { resolvers } from "./src/resolvers.js";
import mongoose from "mongoose";
import "dotenv/config";

import DataLoader from "dataloader";
import {
  getDeityByIds,
  getUsersByIds,
  getFellowshipByIds,
  getBackerBucksByIds,
  getBotBidsByIds,
} from "./src/dataLoders.js";

import { steloAuctionBotKeeper } from "./src/keepers/steloAuctionBotKeeper.js";

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("mongoose connected.");
  } catch (err) {
    console.error(err);
  }

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the keeper
  steloAuctionBotKeeper().catch(console.error);

  // Passing an ApolloServer instance to the `startStandaloneServer` function:
  //  1. creates an Express app
  //  2. installs your ApolloServer instance as middleware
  //  3. prepares your app to handle incoming requests
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: () => ({
      userLoader: new DataLoader(getUsersByIds),
      fellowshipLoader: new DataLoader(getFellowshipByIds),
      deitiesLoader: new DataLoader(getDeityByIds),
      backerBuckLoader: new DataLoader(getBackerBucksByIds),
      botBidsLoader: new DataLoader(getBotBidsByIds),
    }),
  });

  console.log(`🚀  Server ready at: ${url}`);
};

main();
