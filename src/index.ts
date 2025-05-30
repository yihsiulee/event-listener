import { ethers } from "ethers";
import { config } from "./config";
import { getBlockByTimestamp } from "./getBlockByTimestamp";
import { fetchResultEventsChunked } from "./fetchEvents";

async function main() {
  const args = process.argv.slice(2);
  const fromArg = args.find((a) => a.startsWith("--from-date="));
  const toArg = args.find((a) => a.startsWith("--to-date="));

  if (!fromArg || !toArg) {
    console.error("❌ 請提供 --from-date 和 --to-date (e.g. 2024-01-01)");
    process.exit(1);
  }

  const fromDate = new Date(fromArg.split("=")[1]);
  const toDate = new Date(toArg.split("=")[1]);

  const provider = new ethers.JsonRpcProvider(config.RPC_URL);

  const fromBlock = await getBlockByTimestamp(
    provider,
    Math.floor(fromDate.getTime() / 1000)
  );
  const toBlock = await getBlockByTimestamp(
    provider,
    Math.floor(toDate.getTime() / 1000)
  );

  console.log(`📦 查詢範圍區塊: ${fromBlock} → ${toBlock}`);
  await fetchResultEventsChunked(provider, fromBlock, toBlock);
}

main().catch(console.error);
