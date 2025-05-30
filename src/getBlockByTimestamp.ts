import { ethers } from "ethers";

export async function getBlockByTimestamp(
  provider: ethers.JsonRpcProvider,
  targetTimestamp: number
): Promise<number> {
  let latest = await provider.getBlockNumber();
  let earliest = 0;

  while (earliest <= latest) {
    const middle = Math.floor((earliest + latest) / 2);
    const block = await provider.getBlock(middle);
    if (!block) break;
    if (block.timestamp < targetTimestamp) {
      earliest = middle + 1;
    } else {
      latest = middle - 1;
    }
  }

  return earliest;
}
