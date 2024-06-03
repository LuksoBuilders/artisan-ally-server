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
} from "./src/dataLoders.js";

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
    }),
  });

  console.log(`🚀  Server ready at: ${url}`);
};

main();
