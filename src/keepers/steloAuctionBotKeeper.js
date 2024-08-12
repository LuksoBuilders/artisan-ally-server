import ethers from "ethers";
import { request, gql } from "graphql-request";
import { GRAPHQL_SERVER_ADDRESS } from "../serverAddress.js";

const RPC_URL = process.env.RPC_URL;
const KEEPER_WALLET = process.env.KEEPER_WALLET;

const STELO_ADDRESS = "0x4bed66ba55006f81dbc53c094a0ec09f5fd1ff2f";
const STELO_AUCTION_BOT_ADDRESS = "0xB957A0eA94A23f05f54fe740719691e1887b844F";

const STELO_ABI = ["function getCurrentPrice() public view returns (uint256)"];

const STELO_AUCTION_BOT_ABI = [
  "function participateForUser(address _user) external",
];

async function fetchBids() {
  const query = gql`
    {
      botBids(first: 1000) {
        id
        maxPrice
        amount
      }
    }
  `;

  const data = await request(GRAPHQL_SERVER_ADDRESS, query);
  return data.botBids;
}

export async function steloAuctionBotKeeper() {
  // Set up ethers provider and signer
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(KEEPER_WALLET, provider);

  // Set up contract instances
  const stelo = new ethers.Contract(STELO_ADDRESS, STELO_ABI, signer);
  const steloAuctionBot = new ethers.Contract(
    STELO_AUCTION_BOT_ADDRESS,
    STELO_AUCTION_BOT_ABI,
    signer
  );

  async function checkAndParticipate() {
    try {
      // Fetch bids
      const bids = await fetchBids();

      // Filter and sort bids
      const validBids = bids
        .filter((bid) =>
          ethers.BigNumber.from(bid.amount).gte(
            ethers.BigNumber.from(bid.maxPrice)
          )
        )
        .sort((a, b) =>
          ethers.BigNumber.from(b.maxPrice).sub(
            ethers.BigNumber.from(a.maxPrice)
          )
        );

      if (validBids.length === 0) {
        console.log("No valid bids found");
        return;
      }

      const topBid = validBids[0];

      // Get current price
      const currentPrice = await stelo.getCurrentPrice();

      console.log(
        `Top bid: ${topBid.id}, Max Price: ${topBid.maxPrice}, Current Price: ${currentPrice}`
      );

      if (
        ethers.BigNumber.from(currentPrice).lte(
          ethers.BigNumber.from(topBid.maxPrice)
        )
      ) {
        console.log(`Participating for user: ${topBid.id}`);

        // Participate in auction
        const tx = await steloAuctionBot.participateForUser(topBid.id);
        await tx.wait();

        console.log(
          `Participation successful for user: ${topBid.id}, Transaction: ${tx.hash}`
        );
      } else {
        console.log("Current price is higher than the top bid's max price");
      }
    } catch (error) {
      console.error("Error in checkAndParticipate:", error);
    }
  }

  // Run the check every 20 seconds
  setInterval(checkAndParticipate, 1000);
}

