// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
export const typeDefs = `#graphql
    type Asset {
        verificationFunction: String
        verificationData: String
        url: String
        fileType: String
    }

    type Image {
        width: Int
        height: Int
        verificationFunction: String
        verificationData: String
        url: String
    }

    type Link {
        title: String
        url: String
    }

    type Attribute {
        key: String
        value: String
        type: String
    }

    type LSP4Metadata {
        name: String
        description: String
        story: String
        mythology: String
        assets: [Asset]
        images: [[Image]]
        links: [Link]
        attributes: [Attribute]
    }

    type LSP4Fellowship {
        description: String
        assets: [Asset]
        images: [[Image]]
        links: [Link]
        attributes: [Attribute]
    }

    type Verification {
        method: String
        data: String
    }

    type Avatar {
        verification: Verification
        url: String
        fileType: String
    }

    type ProfileImage {
        width: Int
        height: Int
        url: String
        verification: Verification
        address: String
        tokenId: String
    }

    type BackgroundImage {
        width: Int
        height: Int
        url: String
        verification: Verification
    }

    type LSP3Profile {
        name: String
        description: String
        links: [Link]
        tags: [String]
        avatar: [Avatar]
        profileImage: [ProfileImage]
        backgroundImage: [BackgroundImage]
    }

   type User {
      id: String!
      profile: LSP3Profile
      fellowships: [Fellowship!]!
      deities: [Deity!]! 
      backerBucks: [BackerBuck!]! 
      contributions: [Contribution!]! 
      endorsements: [Endorsement!]! 
      endorseds: [Endorsement!]!
      holyShitsBalance: String!
    }

    type FellowshipPrices {
      initialPrice: String!
      initialGrowthFactor: String!
      eventualGrowthFactor: String!
      diminishingFactor: String
    }

    type Fellowship  {
      id: String!
      name: String
      symbol: String
      address: String!
      metadata: String
      info: LSP4Fellowship
      contributionAddress: String
      endorsementAddress: String
      priceGrowth: String
      initialPrice: String
      currentPrice: String
      totalSupply: String!
      backerBucks: [BackerBuck!]!
      contributions: [Contribution!]!
      endorsements: [Endorsement!]!
      founder: Deity!
      artisan: User!
      raisedAmount: String!
      contributionAmount: String!
      endorsementAmount: String!
      version: String!
      prices: FellowshipPrices
    }
    
    type Deity  {
      id: String!
      tokenIdNumber: String!
      metadata: LSP4Metadata
      xp: String!
      level: String!
      owner: User!
      withdrawable: String!
      tier: String!
      slots: [Slot!]!
      portfolio: [Fellowship!]! 
    }
    
    type BackerBuck{
      id: String!
      owner: User!
      fellowship: Fellowship!
      amount: String!
      contributions: String!
      purifiable: String!
    }
    
    type Contribution  {
      id: String!
      contributor: User!
      fellowship: Fellowship!
      amount: String!
      purifiable: String!
    }
    
    type Endorsement {
      id: String!
      fellowship: Fellowship!
      endorser: User!
      from: User!
      amount: String!
    }
    
    type Slot {
      id: String!
      deity: Deity!
      index: String!
      usedAt: String!
    }

    type GlobalVars {
      totalFeeCollected: String!
      totalRaisedAmount: String!
      divineDungDepotBalance: String!
    }

    type Query {
        globalVars: GlobalVars!
        user(userAddress: String!): User!
        users: [User!]!
        deity(deityId: String!): Deity!
        deities: [Deity!]!
        userDeities(userAddress: String!): [Deity!]!
        userFellowships(userAddress: String!): [Fellowship!]!
        fellowship(id: String!): Fellowship
        fellowships: [Fellowship!]!
    }
`;
