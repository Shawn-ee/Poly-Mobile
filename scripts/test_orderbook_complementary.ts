import {
  canBinaryComplementOrdersCross,
  getImpliedComplementPrice,
} from "../src/server/services/binaryComplementaryPricing";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

function main() {
  const impliedYesAsk = getImpliedComplementPrice("0.81");
  assert(impliedYesAsk.toString() === "0.19", `expected implied complement 0.19, got ${impliedYesAsk.toString()}`);

  assert(
    canBinaryComplementOrdersCross({
      takerBuyPrice: "0.19",
      makerSellComplementPrice: "0.81",
    }),
    "BUY YES 0.19 should economically cross SELL NO 0.81",
  );

  assert(
    canBinaryComplementOrdersCross({
      takerBuyPrice: "0.18",
      makerSellComplementPrice: "0.82",
    }),
    "BUY YES 0.18 should economically cross SELL NO 0.82",
  );

  assert(
    !canBinaryComplementOrdersCross({
      takerBuyPrice: "0.18",
      makerSellComplementPrice: "0.81",
    }),
    "BUY YES 0.18 should not economically cross SELL NO 0.81",
  );

  console.log(
    "Complementary pricing helper script passed. Execution-side complementary matching remains intentionally disabled pending safe collateral accounting.",
  );
}

main();
