import { CONTRACT_ADDRESSES, Provider } from "../provider.js";
import { UniversalProfileAbi } from "../abis/UniversalProfile.js";
import { ethers } from "ethers";

// from address to uri
const userVURICache = new Map();

export const getUserVerifiableURI = async (userAddress) => {
  const profileKey =
    "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5";

  const cachedVURI = userVURICache.get(userAddress);

  if (cachedVURI && cachedVURI.validTill > new Date()) {
    return cachedVURI.data;
  } else {
    const UPContract = new ethers.Contract(
      userAddress,
      UniversalProfileAbi,
      Provider
    );

    const data = await UPContract.getData(profileKey);

    console.log(data);

    var validTill = new Date();
    validTill.setMinutes(validTill.getMinutes() + 10);

    userVURICache.set(userAddress, { data, validTill });

    return data;
  }
};
