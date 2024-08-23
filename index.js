import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createServer } from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

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
  getFeedByIds,
  getPostByIds,
  getNotificationsById,
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

  // Start the keeper

  // UNCOMMENT THIS!!!!!
  //steloAuctionBotKeeper().catch(console.error);

  const app = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: "/graphql",
  });

  const createContext = async (req, res) => ({
    userLoader: new DataLoader(getUsersByIds),
    fellowshipLoader: new DataLoader(getFellowshipByIds),
    deitiesLoader: new DataLoader(getDeityByIds),
    backerBuckLoader: new DataLoader(getBackerBucksByIds),
    botBidsLoader: new DataLoader(getBotBidsByIds),
    feedLoader: new DataLoader(getFeedByIds),
    postLoader: new DataLoader(getPostByIds),
    notificationLoader: new DataLoader(getNotificationsById),
  });

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx, msg, args) => {
        // This will be run every time the client sends a subscription request
        // Returning an object will add that information to
        // contextValue, which all of our resolvers have access to.
        return createContext(ctx.extra.request, ctx.extra.response);
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors(),
    express.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: createContext,
    })
  );

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/`);

  // Passing an ApolloServer instance to the `startStandaloneServer` function:
  //  1. creates an Express app
  //  2. installs your ApolloServer instance as middleware
  //  3. prepares your app to handle incoming requests
  //const { url } = await startStandaloneServer(server, {
  //  listen: { port: 4000 },
  //  context: () => ({
  //    userLoader: new DataLoader(getUsersByIds),
  //    fellowshipLoader: new DataLoader(getFellowshipByIds),
  //    deitiesLoader: new DataLoader(getDeityByIds),
  //    backerBuckLoader: new DataLoader(getBackerBucksByIds),
  //    botBidsLoader: new DataLoader(getBotBidsByIds),
  //    feedLoader: new DataLoader(getFeedByIds),
  //    postLoader: new DataLoader(getPostByIds),
  //    notificationLoader: new DataLoader(getNotificationsById),
  //  }),
  //});

  //console.log(`🚀  Server ready at: ${url}`);
};

main();
