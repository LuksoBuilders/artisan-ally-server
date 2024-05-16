import mongoose from "mongoose";
import axios from "axios";
import { parseVerifiableURI } from "../utils/index.js";

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
  verifiableURI: String,
  name: String,
  description: String,
  links: [LinkSchema],
  tags: [String],
  avatar: [AvatarSchema],
  profileImage: [ProfileImageSchema],
  backgroundImage: [BackgroundImageSchema],
});

const LSP3Profile = mongoose.model("LSP3Profile", LSP3ProfileSchema);

export const getLSP3Profile = async (verifiableURI) => {
  try {
    if (!verifiableURI) {
      return {};
    }

    const existedMetadata = await LSP3Profile.findOne({ verifiableURI });
    if (!existedMetadata) {
      const { decodedUrl } = parseVerifiableURI(verifiableURI);
      const result = await axios.get(
        decodedUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
      );

      const lsp3Profile = new LSP3Profile({
        verifiableURI,
        ...result.data.LSP3Profile,
      });
      return await lsp3Profile.save();
    } else {
      return existedMetadata;
    }
  } catch (err) {
    console.error(err);
  }
};
