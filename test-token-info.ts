import { getTokenInfo } from './lib/blockchain';

async function test() {
  const CA = '0x39b4b879b8521d6a8c3a87cda64b969327b7fba3';
  console.log(`Testing token info for: ${CA}`);
  const info = await getTokenInfo(CA as `0x${string}`);
  console.log(JSON.stringify(info, null, 2));
}

test();
