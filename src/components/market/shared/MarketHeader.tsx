import MarketStatusBadge from "@/components/market/shared/MarketStatusBadge";

type MarketHeaderProps = {
  title: string;
  description: string;
  status: string;
  walletBalance: number | null;
  metaChips?: string[];
};

export default function MarketHeader({
  title,
  description,
  status,
  walletBalance,
  metaChips = [],
}: MarketHeaderProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
          {metaChips.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              {metaChips.map((chip) => (
                <span key={chip} className="rounded-full border border-neutral-200 px-2 py-0.5">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="text-right text-xs text-neutral-600">
          <MarketStatusBadge status={status} />
          <div className="mt-2">
            Wallet: {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
        </div>
      </div>
    </div>
  );
}


