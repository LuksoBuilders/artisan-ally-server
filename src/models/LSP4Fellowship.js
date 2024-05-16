import mongoose from "mongoose";
import axios from "axios";
import { parseVerifiableURI } from "../utils/index.js";

const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  verificationFunction: String,
  verificationData: String,
  url: String,
  fileType: String,
});

const ImageSchema = new Schema({
  width: Number,
  height: Number,
  verificationFunction: String,
  verificationData: String,
  url: String,
});

const LinkSchema = new Schema({
  title: String,
  url: String,
});

const AttributeSchema = new Schema({
  key: String,
  value: String,
  type: String,
});

const LSP4FellowshipSchema = new Schema({
  verifiableURI: String,
  name: String,
  description: String,
  assets: [AssetSchema],
  images: [[ImageSchema]],
  links: [LinkSchema],
  attributes: [AttributeSchema],
});

export const LSP4Fellowship = mongoose.model(
  "LSP4Fellowship",
  LSP4FellowshipSchema
);

export const getLSP4Fellowship = async (verifiableURI) => {
  try {
    if (!verifiableURI) {
      return {};
    }
    const existedMetadata = await LSP4Fellowship.findOne({ verifiableURI });
    if (!existedMetadata) {
      const { decodedUrl } = parseVerifiableURI(verifiableURI);
      const result = await axios.get(
        decodedUrl.replace(
          "ipfs://",
          "https://gateway.lighthouse.storage/ipfs/"
        )
      );

      const lsp4Metadata = new LSP4Fellowship({
        verifiableURI,
        ...result.data.LSP4Metadata,
      });
      return await lsp4Metadata.save();
    } else {
      return existedMetadata;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
