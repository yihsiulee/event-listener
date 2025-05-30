import { ethers } from "ethers";
import fs from "fs";
import { config } from "./config";

type EventRecord = {
  blockNumber: number;
  txHash: string;
  from: string;
  index: string;
  success: boolean;
  passthrough: string;
};

async function queryWithRetry(
  contract: ethers.Contract,
  provider: ethers.JsonRpcProvider,
  from: number,
  to: number,
  retries = 3
): Promise<EventRecord[]> {
  try {
    const events = await contract.queryFilter("Result", from, to);
    const records: EventRecord[] = [];

    for (const e of events) {
      const tx = await provider.getTransaction(e.transactionHash);
      records.push({
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
        from: tx!.from,
        index: (e as ethers.EventLog).args!.index.toString(),
        success: (e as ethers.EventLog).args!.success,
        passthrough: (e as ethers.EventLog).args!.passthrough.toString(),
      });
    }
    return records;
  } catch (err) {
    if (retries > 0) {
      console.warn(`⚠️ 查詢失敗 ${from}~${to}，重試中 (${retries})`);
      await new Promise((res) => setTimeout(res, 1000));
      return queryWithRetry(contract, provider, from, to, retries - 1);
    } else {
      console.error(`❌ 查詢失敗放棄: ${from}~${to}`, err);
      return [];
    }
  }
}

export async function fetchResultEventsChunked(
  provider: ethers.JsonRpcProvider,
  fromBlock: number,
  toBlock: number,
  chunkSize = 2000
) {
  const contract = new ethers.Contract(
    config.CONTRACT_ADDRESS,
    config.ABI,
    provider
  );
  let allEvents: EventRecord[] = [];

  for (let i = fromBlock; i <= toBlock; i += chunkSize) {
    const from = i;
    const to = Math.min(i + chunkSize - 1, toBlock);
    console.log(`🔎 撈取區塊 ${from} ~ ${to}`);

    const events = await queryWithRetry(contract, provider, from, to);
    allEvents = allEvents.concat(events);
  }

  // ✅ 儲存所有事件（包含 success=false 的）供檢查
  fs.writeFileSync("output.json", JSON.stringify(allEvents, null, 2));

  const csvLines = ["blockNumber,txHash,from,index,success,passthrough"];
  for (const e of allEvents) {
    csvLines.push(
      [e.blockNumber, e.txHash, e.from, e.index, e.success, e.passthrough].join(
        ","
      )
    );
  }
  fs.writeFileSync("output.csv", csvLines.join("\n"));

  // ✅ 僅統計成功事件的 from address
  const countMap: Record<string, number> = {};
  for (const e of allEvents) {
    if (!e.success) continue; // ✅ 只統計 success == true 的
    countMap[e.from] = (countMap[e.from] || 0) + 1;
  }

  const sorted = Object.entries(countMap)
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count);

  fs.writeFileSync("stats.json", JSON.stringify(sorted, null, 2));
  fs.writeFileSync(
    "stats.csv",
    ["address,count"]
      .concat(sorted.map((e) => `${e.address},${e.count}`))
      .join("\n")
  );

  console.log(`✅ 共輸出 ${allEvents.length} 筆事件`);
  console.log(
    `📊 僅統計 success=true 的事件，結果儲存於 stats.json / stats.csv`
  );
}
