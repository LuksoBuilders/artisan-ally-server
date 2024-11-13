import mongoose from "mongoose";
import axios from "axios";
import { parseVerifiableURI } from "../utils/index.js";
import { IPFSGatewayModule } from "../utils/IPFSGatewayModule.js";

const Schema = mongoose.Schema;

const LinkSchema = new Schema({
  title: String,
  url: String,
});

const VerificationSchema = new Schema({
  method: String,
  data: String,
});

const AvatarSchema = new Schema({
  verification: VerificationSchema,
  url: String,
  fileType: String,
});

const ProfileImageSchema = new Schema({
  width: Number,
  height: Number,
  url: String,
  verification: VerificationSchema,
  address: String, // This could be an Ethereum address
  tokenId: String, // Optional, only if token contract is an LSP7
});

const BackgroundImageSchema = new Schema({
  width: Number,
  height: Number,
  url: String,
  verification: VerificationSchema,
});

const LSP3ProfileSchema = new Schema({
  verifiableURI: {
    type: String,
    index: true,
  },
  name: String,
  description: String,
  links: [LinkSchema],
  tags: [String],
  avatar: [AvatarSchema],
  profileImage: [ProfileImageSchema],
  backgroundImage: [BackgroundImageSchema],
  retry: {
    type: Number,
    default: 0,
  },
});

const LSP3Profile = mongoose.model("LSP3Profile", LSP3ProfileSchema);

const cacheInvalidator = async () => {
  setInterval(async () => {
    console.log("running lsp3 cache invalidator");

    await LSP3Profile.deleteMany({
      $or: [{ name: "" }, { name: { $exists: false } }],
    });
  }, 20 * 1000);
};

cacheInvalidator();

export const getLSP3Profile = async (verifiableURI) => {
  try {
    if (!verifiableURI || verifiableURI === "0x") {
      return {};
    }

    const existedMetadata = await LSP3Profile.findOne({ verifiableURI });

    if (!existedMetadata) {
      const { decodedUrl } = parseVerifiableURI(verifiableURI);

      let cid = decodedUrl.replace("ipfs://", "");
      if (cid.includes("/ipfs/")) {
        cid = cid.split("/ipfs/").pop();
      }

      const ipfsGateway = new IPFSGatewayModule();

      console.log("cid ============", cid);

      const result = await ipfsGateway.getIPFSFile(cid);

      let resultObject;

      if (typeof result === "string") {
        resultObject = JSON.parse(result);
      } else {
        resultObject = result;
      }

      const lsp3Profile = new LSP3Profile({
        verifiableURI,
        ...resultObject.LSP3Profile,
      });
      console.log(lsp3Profile, result, result.LSP3Profile, resultObject);
      return await lsp3Profile.save();
    } else {
      return existedMetadata;
    }
  } catch (err) {
    console.error(err);
  }
};
