import "dotenv/config";

async function main() {
  const key = process.env.SERPAPI_API_KEY;
  const r = await fetch("https://serpapi.com/account.json?api_key=" + key);
  console.log("status", r.status);
  const j = await r.json();
  console.log("plan", j.plan_name, "left", j.total_searches_left, "month", j.searches_per_month);
  console.log("hourly", j.account_rate_limit_per_hour);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
