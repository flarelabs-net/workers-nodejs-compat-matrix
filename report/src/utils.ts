export const getPolyfillSearchLink = (target: string, symbol: string) => {
  const GITHUB_SEARCH_BASE_URL = `https://github.com/search?q=`;

  let filter = null;
  switch (target) {
    case "node18":
    case "node20":
    case "node22":
      filter = `repo:nodejs/node path:/^lib\\/internal\\//`;
      break;
    case "bun":
      filter = `repo:oven-sh/bun path:/^src\\/js\\/node\\//`;
      break;
    case "deno":
      filter = `repo:denoland/deno path:/^ext\\/node\\/polyfills\\//`;
      break;
    case "workerd":
      filter = `repo:cloudflare/workerd path:/^src\\/node\\//`;
      break;
    case "wranglerV3":
      filter = `repo:ionic-team/rollup-plugin-node-polyfills path:/^polyfills\\//`;
      break;
    case "wranglerJspm":
      filter = `repo:jspm/jspm-core path:/^src-browser\\//`;
      break;
    case "wranglerUnenv":
      filter = `repo:unjs/unenv path:/^src\\/runtime\\/node\\//`;
      break;
    default:
      break;
  }

  if (!filter) return null;

  return encodeURI(`${GITHUB_SEARCH_BASE_URL}${filter} ${symbol}`);
};

export const getDocsLink = (key: string) => {
  const NODE_DOCS_BASE_URL = "https://nodejs.org/docs/latest/api/";

  const pathname = key
    .replaceAll("*", "")
    .replace("/promises", "")
    .replace("/strict", "");
  return `${NODE_DOCS_BASE_URL}${pathname}.html`;
};

export const pct = (part: number, total: number) => {
  const percentage = (part / total) * 100;
  const fractionDigits = percentage === 0 || percentage > 1 ? 0 : 1;
  return `${percentage.toFixed(fractionDigits)}%`;
};