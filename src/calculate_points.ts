import { createReadStream, createWriteStream } from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import { join } from "path";
import { readdir } from "fs/promises";

interface StatsData {
  address: string;
  //   count: number;
  points?: number;
}

const TOTAL_POINTS = 2_188_181;
const STATS_DIR = "0221_to_0530";
const OUTPUT_FILE = "0221_to_0530/points_distribution.csv";

async function calculatePoints(): Promise<void> {
  try {
    // 讀取所有 CSV 檔案
    const files = await readdir(STATS_DIR);
    const csvFiles = files.filter((file) => file.endsWith("stats.csv"));

    let totalCount = 0;
    const addressCounts: Map<string, number> = new Map();

    // 處理每個 CSV 檔案
    for (const file of csvFiles) {
      const filePath = join(STATS_DIR, file);
      const parser = createReadStream(filePath).pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
        })
      );

      for await (const record of parser) {
        const address = record.address;
        const count = parseInt(record.count, 10);

        if (!isNaN(count)) {
          totalCount += count;
          addressCounts.set(address, (addressCounts.get(address) || 0) + count);
        }
      }
    }

    console.log(`總數量: ${totalCount}`);

    // 計算每個地址的點數
    const results: StatsData[] = [];
    let totalPoints = 0;

    for (const [address, count] of addressCounts) {
      const points = Math.floor((count / totalCount) * TOTAL_POINTS);
      totalPoints += points;
      results.push({ address, points });
    }

    console.log(`已分配點數總和: ${totalPoints}`);

    // 輸出結果到 CSV
    const stringifier = stringify({
      header: true,
      columns: ["address", "points"],
    });

    const outputStream = createWriteStream(OUTPUT_FILE);
    stringifier.pipe(outputStream);

    for (const result of results) {
      stringifier.write(result);
    }

    stringifier.end();

    console.log(`結果已輸出到: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("發生錯誤:", error);
    process.exit(1);
  }
}

calculatePoints();
