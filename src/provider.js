import { ethers } from "ethers";

const testnetContractAddresses = {
  apexDeities: "0xb4E32a20aa27B5891Bfa592c392c9858A1DD3945",
  holyShit: "0xAd28D1A66597f0EC79829A02Db9CCCf361f2b8Ac",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
};

const mainnetContractAddresses = {
  apexDeities: "0xb4E32a20aa27B5891Bfa592c392c9858A1DD3945",
  holyShit: "0x2fF8dF5F47Cd67AfE425a2acb28d6506838495Ee",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
  //holyShit: "",
};

export const CONTRACT_ADDRESSES = mainnetContractAddresses;

const testnetRPC = "https://4201.rpc.thirdweb.com";
const mainnetRPC = "http://64.225.80.186:8545"; //"https://rpc.lukso.sigmacore.io";

const RPC_ADDRESS = mainnetRPC;

export const Provider = new ethers.providers.JsonRpcProvider(RPC_ADDRESS);
