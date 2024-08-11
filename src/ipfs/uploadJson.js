import lighthouse from "@lighthouse-web3/sdk";

/**
 * Uploads a JSON object to IPFS using Lighthouse SDK
 * @param {Record<string, any>} jsonData - The JSON object to upload
 * @returns {Promise<string>} - A promise that resolves to the IPFS hash of the uploaded JSON
 */
export async function uploadJson(jsonData) {
  try {
    // Convert JSON to a string

    // Convert string to Buffer
    const buffer = Buffer.from(jsonData);

    // Upload buffer to Lighthouse
    const response = await lighthouse.uploadBuffer(
      buffer,
      process.env.LIGHTHOUSE_STORAGE_API_KEY
    );

    // Return the IPFS hash
    return response.data.Hash;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw error;
  }
}
