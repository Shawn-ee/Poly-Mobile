-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_type_chainId_txHash_logIndex_key" ON "LedgerTransaction"("type", "chainId", "txHash", "logIndex");
