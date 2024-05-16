import web3 from "web3";

export function parseVerifiableURI(VerifiableURI) {
  // Assuming VerifiableURI is a string in the format specified in the example

  // Extracting individual parts
  const verfiableUriIdentifier = VerifiableURI.substring(0, 6);
  const verificationMethod = "0x" + VerifiableURI.substring(6, 14);
  const verificationDataLength = "0x" + VerifiableURI.substring(14, 18);
  const verificationData = "0x" + VerifiableURI.substring(18, 82);
  const encodedUrl = "0x" + VerifiableURI.substring(82);

  // Decoding URL from hex
  let decodedUrl;
  if (verfiableUriIdentifier === "0x0000") {
    decodedUrl = web3.utils.hexToUtf8(encodedUrl);
  } else {
    decodedUrl = web3.utils.hexToUtf8(encodedUrl).replace("://", "ipfs://");
  }

  // Constructing object with extracted parts
  const verifiableObject = {
    verfiableUriIdentifier: verfiableUriIdentifier,
    verificationMethod: verificationMethod,
    verificationDataLength: verificationDataLength,
    verificationData: verificationData,
    encodedUrl: encodedUrl,
    decodedUrl: decodedUrl,
  };

  return verifiableObject;
}
