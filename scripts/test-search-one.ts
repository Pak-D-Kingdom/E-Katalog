import "dotenv/config";
import { getImageSearchProvider } from "../src/lib/image-search/provider";

async function main() {
  const provider = getImageSearchProvider();
  const out = await provider.search("ULTRA MILK FULLCREAM 125ml kemasan produk", 5);
  console.log("requestCount", out.requestCount);
  console.log("candidates", out.candidates.length);
  for (const c of out.candidates) {
    console.log("-", c.title, "|", c.imageUrl.slice(0, 80), "|", c.domain, "|", c.isProduct);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
