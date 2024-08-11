import mongoose from "mongoose";
import { ethers } from "ethers";
import { IPFSGatewayModule } from "../utils/IPFSGatewayModule.js";

const Schema = mongoose.Schema;

const PostContentSchema = new Schema({
  verifiableURI: String,
  variant: Number,
  content: String,
});

const PostContent = mongoose.model("PostContent", PostContentSchema);

function parseVerifiableURI(verifiableURI) {
  const stripped = verifiableURI.startsWith("0x")
    ? verifiableURI.slice(2)
    : verifiableURI;

  const verificationMethod = "0x" + stripped.slice(4, 12);
  const verificationDataLength = parseInt(stripped.slice(12, 16), 16);
  const verificationData =
    "0x" + stripped.slice(16, 16 + verificationDataLength * 2);
  const encodedURI = stripped.slice(16 + verificationDataLength * 2);

  return {
    verificationMethod,
    verificationData,
    uri: encodedURI ? ethers.utils.toUtf8String("0x" + encodedURI) : "",
  };
}

export const getPostContent = async (verifiableURI) => {
  try {
    if (!verifiableURI || verifiableURI === "0x") {
      return {};
    }

    const existingPostContent = await PostContent.findOne({ verifiableURI });

    if (existingPostContent) {
      return existingPostContent;
    }

    const { uri } = parseVerifiableURI(verifiableURI);

    let postContent;

    if (!uri) {
      // If URI is empty, save empty variant and content
      postContent = new PostContent({
        verifiableURI,
        variant: 0,
        content: "",
      });
    } else {
      const cid = uri.replace("ipfs://", "");
      const ipfsGateway = new IPFSGatewayModule();
      const result = await ipfsGateway.getIPFSFile(cid);

      console.log("PostContent result is: ", result);

      postContent = new PostContent({
        verifiableURI,
        variant: result.variant,
        content: result.content,
      });
    }

    return await postContent.save();
  } catch (err) {
    console.error(err);
    throw err; // Propagate the error to be handled by the caller
  }
};