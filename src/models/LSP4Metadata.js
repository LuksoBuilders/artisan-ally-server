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

const LSP4MetadataSchema = new Schema({
  verifiableURI: String,
  name: String,
  description: String,
  story: String,
  mythology: String,
  assets: [AssetSchema],
  images: [[ImageSchema]],
  links: [LinkSchema],
  attributes: [AttributeSchema],
});

export const LSP4Metadata = mongoose.model("LSP4Metadata", LSP4MetadataSchema);

export const getLSP4Metadata = async (verifiableURI) => {
  try {
    if (!verifiableURI) {
      return {};
    }
    const existedMetadata = await LSP4Metadata.findOne({ verifiableURI });
    if (!existedMetadata) {
      const { decodedUrl } = parseVerifiableURI(verifiableURI);
      const result = await axios.get(
        decodedUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
      );

      const lsp4Metadata = new LSP4Metadata({
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
