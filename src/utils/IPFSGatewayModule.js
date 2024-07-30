import axios from "axios";
import FS from "fs";
import path from "path";

const fs = FS.promises;

export class IPFSGatewayModule {
  static DEFAULT_GATEWAYS = [
    "https://api.universalprofile.cloud",
    "https://ipfs.io",
    "https://cloudflare-ipfs.com",
    "https://gateway.pinata.cloud",
    "https://dweb.link",
  ];

  constructor(
    gateways = IPFSGatewayModule.DEFAULT_GATEWAYS,
    cacheDir = "./ipfs-cache"
  ) {
    this.gateways = gateways;
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error("Error creating cache directory:", error);
    }
  }

  async getIPFSFile(cid) {

    console.log(cid)

    const cachedFile = await this.getFromCache(cid);
    if (cachedFile) {
      return cachedFile;
    }

    const controllers = this.gateways.map(() => new AbortController());
    const requests = this.gateways.map((gateway, index) =>
      this.makeRequest(gateway, cid, controllers[index].signal)
    );

    try {
      // Create a promise that resolves with the first successful result
      const raceForSuccess = Promise.any(requests);

      // Create a promise that resolves when all requests have settled
      const allSettled = Promise.allSettled(requests);

      const result = await Promise.race([raceForSuccess, allSettled]);

      if (Array.isArray(result)) {
        // If the result is an array, it means all requests have settled without a success
        const errors = result
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason.message);
        throw new Error(`All requests failed. Errors: ${errors.join(", ")}`);
      } else {
        // If it's not an array, we have a successful result
        controllers.forEach((controller, index) => {
          if (index !== result.gatewayIndex) {
            controller.abort();
          }
        });

        await this.saveToCache(cid, result.data);
        return result.data;
      }
    } catch (error) {
      console.error("Error fetching IPFS file:", error);
      throw error;
    }
  }

  async makeRequest(gateway, cid, signal) {
    try {
      const response = await axios.get(`${gateway}/ipfs/${cid}`, {
        timeout: 5000,
        signal,
      });
      return {
        data: response.data,
        gatewayIndex: this.gateways.indexOf(gateway),
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`Request to ${gateway} was aborted`);
      } else {
        console.error(`Error fetching from ${gateway}:`, error.message);
      }
      throw error;
    }
  }

  async getFromCache(cid) {
    const cacheFilePath = path.join(this.cacheDir, cid);
    try {
      const data = await fs.readFile(cacheFilePath, "utf8");
      console.log(`Retrieved ${cid} from cache`);
      return data;
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Error reading from cache:", error);
      }
      return null;
    }
  }

  async saveToCache(cid, data) {
    const cacheFilePath = path.join(this.cacheDir, cid);
    try {
      const stringData =
        typeof data === "object" ? JSON.stringify(data) : data.toString();
      await fs.writeFile(cacheFilePath, stringData);
      console.log(`Saved ${cid} to cache`);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }
}
