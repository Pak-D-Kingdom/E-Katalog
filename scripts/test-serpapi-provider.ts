import assert from "node:assert/strict";
import { SerpApiImageSearchProvider } from "../src/lib/image-search/serpapi";

async function main() {
  const originalFetch = global.fetch;

  // Test 1: normal mapping
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        images_results: [
          { title: "Ultra Milk 125ml", original: "https://example.com/a.jpg", link: "https://shop.example.com/p", is_product: true },
          { title: "Other", original: "https://example.com/b.jpg", link: "https://shop.example.com/q" },
        ],
      }),
      { status: 200 }
    )) as any;

  const provider = new SerpApiImageSearchProvider("test-key");
  const out1 = await provider.search("ultra milk", 5);
  assert.equal(out1.candidates.length, 2);
  assert.equal(out1.candidates[0].imageUrl, "https://example.com/a.jpg");
  assert.equal(out1.candidates[0].isProduct, true);
  assert.equal(out1.requestCount, 1);

  // Test 2: 429 then 200
  let calls = 0;
  global.fetch = (async () => {
    calls++;
    if (calls === 1) {
      return new Response(JSON.stringify({ error: "rate" }), { status: 429, headers: { "retry-after": "0" } });
    }
    return new Response(JSON.stringify({ images_results: [] }), { status: 200 });
  }) as any;
  const out2 = await provider.search("q", 3);
  assert.equal(out2.requestCount, 2);

  // Test 3: invalid key
  global.fetch = (async () => new Response("{}", { status: 401 })) as any;
  let threw = false;
  try {
    await provider.search("q", 3);
  } catch (e: any) {
    threw = true;
    assert.equal(e.kind, "invalid_key");
  }
  assert.ok(threw);

  global.fetch = originalFetch;
  console.log("SerpApi provider tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
