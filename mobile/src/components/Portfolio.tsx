import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { activityPnl, activityShares, decimalOdds } from "../domain/portfolioActivityMetrics";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Locale } from "../mocks/worldCup";
import { money } from "../presentation/formatters";
import type { OrderMode } from "../services/orderService";

export type Position = {
  id: string;
  mode: OrderMode;
  marketId?: string;
  outcomeId?: string;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  amount: number;
  probability: number;
  shares?: number;
  currentPrice?: number;
  currentValue?: number;
  pnl?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioActivity = {
  id: string;
  action: "opened" | "closed" | "canceled";
  title: string;
  outcome: string;
  amount: number;
  entryAmount?: number;
  side?: "buy" | "sell";
  probability?: number;
  isLive?: boolean;
  liveClock?: string;
  timestamp?: string;
};

export type OpenOrder = {
  id: string;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  status: string;
  price: number;
  remaining: number;
};

export type OrderConfirmation = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  amount: number;
  probability?: number;
  status?: string;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioSyncStatus = "hidden" | "syncing" | "synced" | "error";

type PortfolioCopy = {
  balance: string;
  noPositions: string;
  noPositionsBody: string;
  buy: string;
  sell: string;
  invested: string;
  entry: string;
  currentValue: string;
  currentPrice: string;
  estimatedPnl: string;
  closePosition: string;
  recentActivity: string;
  openedPosition: string;
  closedPosition: string;
  canceledOrder: string;
  openOrders: string;
  remaining: string;
  limitPrice: string;
  orderValue: string;
  impliedOdds: string;
  filledShares: string;
  executionPrice: string;
  cancelOrder: string;
  portfolioSyncing: string;
  portfolioSynced: string;
  portfolioSyncError: string;
  portfolioSyncFallback: string;
  orderPlaced: string;
  openPositions: string;
  activityCount: string;
  closedTrades: string;
  liveNow: string;
  justNow: string;
};

export { portfolioPositionValue };

const estimatedPnl = estimatedPositionPnl;

const investedTotal = (positions: Position[]) => positions.reduce((total, position) => total + position.amount, 0);

const currentValueTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + portfolioPositionValue(position), 0);

const pnlTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + estimatedPnl(position), 0);

export function Portfolio({
  t,
  balance,
  positions,
  latestOrder,
  openOrders,
  activities,
  syncStatus,
  closePosition,
  openPositionTrade,
  cancelOpenOrder,
}: {
  locale: Locale;
  t: PortfolioCopy;
  balance: number;
  positions: Position[];
  latestOrder: OrderConfirmation | null;
  openOrders: OpenOrder[];
  activities: PortfolioActivity[];
  syncStatus: PortfolioSyncStatus;
  closePosition: (position: Position) => void;
  openPositionTrade: (position: Position, side: "buy" | "sell") => void;
  cancelOpenOrder: (order: OpenOrder) => void;
}) {
  const closedActivityCount = activities.filter((activity) => activity.action === "closed").length;
  const syncTitle =
    syncStatus === "syncing"
      ? t.portfolioSyncing
      : syncStatus === "synced"
        ? t.portfolioSynced
        : syncStatus === "error"
          ? t.portfolioSyncError
          : "";
  const openOrdersSection =
    openOrders.length > 0 ? (
      <View style={styles.openOrdersBlock}>
        <Text style={styles.openOrdersTitle}>{t.openOrders}</Text>
        {openOrders.slice(0, 5).map((order) => (
          <View key={order.id} style={styles.openOrderItem}>
            <View style={styles.openOrderHeader}>
              <View style={styles.openOrderMain}>
                <Text style={styles.openOrderTitle}>{order.title}</Text>
                <Text style={styles.openOrderMeta}>
                  {order.side === "buy" ? t.buy : t.sell} - {order.outcome} - {order.status}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`cancel-open-order-${order.id}`}
                onPress={() => cancelOpenOrder(order)}
                style={styles.cancelOrderButton}
                testID={`cancel-open-order-${order.id}`}
              >
                <Text style={styles.cancelOrderText}>{t.cancelOrder}</Text>
              </Pressable>
            </View>
            <View style={styles.openOrderMetricGrid}>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.limitPrice}</Text>
                <Text style={styles.openOrderPrice}>{Math.round(order.price * 100)}%</Text>
              </View>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.impliedOdds}</Text>
                <Text style={styles.openOrderMetricValue}>{decimalOdds(order.price)}</Text>
              </View>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.orderValue}</Text>
                <Text style={styles.openOrderMetricValue}>{money(order.remaining)}</Text>
              </View>
            </View>
            <Text style={styles.openOrderRemaining}>
              {t.remaining}: {money(order.remaining)}
            </Text>
          </View>
        ))}
      </View>
    ) : null;

  return (
    <ScrollView accessibilityLabel="portfolio-screen" testID="portfolio-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View accessibilityLabel="fake-balance-card" testID="fake-balance-card" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t.balance}</Text>
        <Text style={styles.balanceValue}>{money(balance)}</Text>
      </View>
      {syncStatus !== "hidden" && (
        <View accessibilityLabel="portfolio-sync-status" testID="portfolio-sync-status" style={styles.syncCard}>
          <Ionicons
            name={syncStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"}
            size={20}
            color={syncStatus === "error" ? "#fbbf24" : "#93c5fd"}
          />
          <View style={styles.syncTextBlock}>
            <Text style={styles.syncTitle}>{syncTitle}</Text>
            {syncStatus === "error" && <Text style={styles.syncBody}>{t.portfolioSyncFallback}</Text>}
          </View>
        </View>
      )}
      <View style={styles.countGrid}>
        <View accessibilityLabel="portfolio-position-count" testID="portfolio-position-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.openPositions}</Text>
          <Text style={styles.positionCountValue}>{positions.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-activity-count" testID="portfolio-activity-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.activityCount}</Text>
          <Text style={styles.positionCountValue}>{activities.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-closed-count" testID="portfolio-closed-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.closedTrades}</Text>
          <Text style={styles.positionCountValue}>{closedActivityCount}</Text>
        </View>
      </View>
      {openOrdersSection}
      {latestOrder && (
        <View accessibilityLabel="latest-order-card" testID="latest-order-card" style={styles.confirmationCard}>
          {latestOrder.isLive && (
            <View accessibilityLabel="latest-order-live-badge" testID="latest-order-live-badge" style={styles.liveBadge}>
              <Ionicons name="radio" color="#fecaca" size={13} />
              <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
            </View>
          )}
          {latestOrder.liveClock && (
            <Text accessibilityLabel="latest-order-live-clock" testID="latest-order-live-clock" style={styles.liveClock}>
              {latestOrder.liveClock}
            </Text>
          )}
          <View style={styles.confirmationTop}>
            <Text style={styles.confirmationTitle}>{t.orderPlaced}</Text>
            <Text style={styles.confirmationAmount}>{money(latestOrder.amount)}</Text>
          </View>
          <Text style={styles.confirmationMeta}>
            {latestOrder.mode.toUpperCase()} - {latestOrder.side === "buy" ? t.buy : t.sell} - {latestOrder.outcome}
            {latestOrder.status ? ` - ${latestOrder.status}` : ""}
          </Text>
          <Text style={styles.confirmationMarket}>{latestOrder.title}</Text>
          {typeof latestOrder.probability === "number" && (
            <View accessibilityLabel="latest-order-execution-details" testID="latest-order-execution-details" style={styles.confirmationDetailGrid}>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.filledShares}</Text>
                <Text style={styles.confirmationDetailValue}>
                  {(latestOrder.filledSize ?? activityShares(latestOrder)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.executionPrice}</Text>
                <Text style={styles.confirmationDetailValue}>{latestOrder.probability}%</Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>
                  {typeof latestOrder.remainingSize === "number" ? t.remaining : t.impliedOdds}
                </Text>
                <Text style={styles.confirmationDetailValue}>
                  {typeof latestOrder.remainingSize === "number"
                    ? latestOrder.remainingSize.toFixed(2)
                    : decimalOdds(latestOrder.probability / 100)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      {positions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={34} color="#64748b" />
          <Text style={styles.emptyTitle}>{t.noPositions}</Text>
          <Text style={styles.emptyText}>{t.noPositionsBody}</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.invested}</Text>
              <Text style={styles.summaryValue}>{money(investedTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.currentValue}</Text>
              <Text style={styles.summaryValue}>{money(currentValueTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.estimatedPnl}</Text>
              <Text style={[styles.summaryValue, pnlTotal(positions) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                {pnlTotal(positions) >= 0 ? "+" : ""}
                {money(pnlTotal(positions))}
              </Text>
            </View>
          </View>
          {positions.map((position) => (
            <View key={position.id} style={styles.positionCard}>
              {position.isLive && (
                <View accessibilityLabel="portfolio-position-live-badge" testID="portfolio-position-live-badge" style={styles.liveBadge}>
                  <Ionicons name="radio" color="#fecaca" size={13} />
                  <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
                </View>
              )}
              {position.liveClock && (
                <Text accessibilityLabel="portfolio-position-live-clock" testID="portfolio-position-live-clock" style={styles.liveClock}>
                  {position.liveClock}
                </Text>
              )}
              <Text style={styles.positionTitle}>{position.title}</Text>
              <Text style={styles.positionMeta}>
                {position.mode.toUpperCase()} - {position.side === "buy" ? t.buy : t.sell} - {position.outcome} - {position.probability}%
              </Text>
              <Text style={styles.positionValue}>{money(position.amount)}</Text>
              <View style={styles.positionDetailGrid}>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.entry}</Text>
                  <Text style={styles.positionDetailValue}>{position.probability}%</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.currentValue}</Text>
                  <Text style={styles.positionDetailValue}>{money(portfolioPositionValue(position))}</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.estimatedPnl}</Text>
                  <Text style={[styles.positionDetailValue, estimatedPnl(position) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                    {estimatedPnl(position) >= 0 ? "+" : ""}
                    {money(estimatedPnl(position))}
                  </Text>
                </View>
              </View>
              {typeof position.shares === "number" && (
                <Text accessibilityLabel={`position-shares-${position.id}`} style={styles.positionServerMeta}>
                  {t.filledShares}: {position.shares.toFixed(2)}
                  {typeof position.currentPrice === "number" ? ` - ${t.currentPrice} ${Math.round(position.currentPrice * 100)}%` : ""}
                </Text>
              )}
              <View style={styles.positionActionRow}>
                <Pressable
                  accessibilityLabel={`position-trade-buy-${position.id}`}
                  onPress={() => openPositionTrade(position, "buy")}
                  style={styles.positionTradeButton}
                  testID={`position-trade-buy-${position.id}`}
                >
                  <Text style={styles.positionTradeButtonText}>{t.buy}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`position-trade-sell-${position.id}`}
                  onPress={() => openPositionTrade(position, "sell")}
                  style={styles.positionTradeButton}
                  testID={`position-trade-sell-${position.id}`}
                >
                  <Text style={styles.positionTradeButtonText}>{t.sell}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`close-position-${position.id}`}
                  onPress={() => closePosition(position)}
                  style={styles.closeButton}
                  testID={`close-position-${position.id}`}
                >
                  <Text style={styles.closeButtonText}>{t.closePosition}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
      {activities.length > 0 && (
        <View style={styles.activityBlock}>
          <Text style={styles.activityTitle}>{t.recentActivity}</Text>
          {activities.slice(0, 5).map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={activity.action === "opened" ? "arrow-up" : activity.action === "canceled" ? "close" : "checkmark"}
                  size={16}
                  color="#dbeafe"
                />
              </View>
              <View style={styles.activityMain}>
                <Text style={styles.activityAction}>
                  {activity.action === "opened"
                    ? t.openedPosition
                    : activity.action === "canceled"
                      ? t.canceledOrder
                      : t.closedPosition}
                </Text>
                {activity.timestamp && (
                  <Text accessibilityLabel={`activity-time-${activity.id}`} style={styles.activityTime}>
                    {activity.timestamp}
                  </Text>
                )}
                {activity.isLive && (
                  <Text accessibilityLabel="portfolio-activity-live-badge" style={styles.activityLiveText}>
                    {t.liveNow}
                  </Text>
                )}
                {activity.liveClock && (
                  <Text accessibilityLabel="portfolio-activity-live-clock" style={styles.activityLiveClock}>
                    {activity.liveClock}
                  </Text>
                )}
                <Text style={styles.activityMeta}>
                  {activity.title} - {activity.outcome}
                </Text>
                {(typeof activity.probability === "number" || (activity.action === "closed" && typeof activity.entryAmount === "number")) &&
                  activity.action !== "canceled" && (
                  <Text accessibilityLabel={`activity-execution-${activity.id}`} style={styles.activityExecution}>
                    {activity.action === "closed"
                      ? `${t.entry} ${typeof activity.probability === "number" ? `${activity.probability}%` : money(activity.entryAmount ?? activity.amount)} - ${t.currentValue} ${money(activity.amount)} - ${t.estimatedPnl} ${
                          activityPnl(activity) >= 0 ? "+" : ""
                        }${money(activityPnl(activity))}`
                      : `${t.filledShares} ${activityShares(activity).toFixed(2)} - ${t.executionPrice} ${activity.probability ?? 0}% - ${
                          t.impliedOdds
                        } ${decimalOdds((activity.probability ?? 0) / 100)}`}
                  </Text>
                )}
              </View>
              <Text style={styles.activityAmount}>{money(activity.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  syncCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  syncTextBlock: { flex: 1 },
  syncTitle: { color: "#f8fafc", fontWeight: "900" },
  syncBody: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  countGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  countTile: { flex: 1, minHeight: 84, justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionCountLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  positionCountValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  summaryItem: { flex: 1, minHeight: 92, padding: 10, borderRadius: 10, backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  summaryLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 8 },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 12, fontWeight: "900", marginBottom: 8 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  positionDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionDetailItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionDetailLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  positionDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  positionServerMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "800", marginTop: 10 },
  pnlPositive: { color: "#22c55e" },
  pnlNegative: { color: "#ef4444" },
  positionActionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionTradeButton: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#0f766e", borderWidth: 1, borderColor: "#14b8a6" },
  positionTradeButtonText: { color: "#ecfeff", fontSize: 14, fontWeight: "900" },
  closeButton: { flex: 1.35, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  closeButtonText: { color: "#dbeafe", fontSize: 14, fontWeight: "900" },
  confirmationCard: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#12213a", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  confirmationTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  confirmationAmount: { color: "#dbeafe", fontWeight: "900" },
  confirmationMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "900", marginTop: 8 },
  confirmationMarket: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 4 },
  confirmationDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  confirmationDetailItem: { flex: 1, minHeight: 54, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationDetailLabel: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  confirmationDetailValue: { color: "#f8fafc", fontSize: 12, fontWeight: "900", marginTop: 5 },
  openOrdersBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  openOrdersTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  openOrderItem: { gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  openOrderHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  openOrderMain: { flex: 1 },
  openOrderTitle: { color: "#f8fafc", fontWeight: "900" },
  openOrderMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  openOrderPrice: { color: "#dbeafe", fontWeight: "900" },
  openOrderMetricGrid: { flexDirection: "row", gap: 8 },
  openOrderMetricBox: { flex: 1, minHeight: 54, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  openOrderMetricLabel: { color: "#64748b", fontSize: 10, fontWeight: "900" },
  openOrderMetricValue: { color: "#dbeafe", fontSize: 11, fontWeight: "900", marginTop: 5 },
  openOrderRemaining: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  cancelOrderButton: { minHeight: 36, minWidth: 92, paddingHorizontal: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  cancelOrderText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  activityBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  activityTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  activityIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  activityMain: { flex: 1 },
  activityAction: { color: "#f8fafc", fontWeight: "900" },
  activityTime: { color: "#64748b", fontSize: 11, fontWeight: "800", marginTop: 2 },
  activityLiveText: { alignSelf: "flex-start", color: "#fecaca", fontSize: 11, fontWeight: "900", marginTop: 3, textTransform: "uppercase" },
  activityLiveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 11, fontWeight: "900", marginTop: 2 },
  activityMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  activityExecution: { color: "#93c5fd", fontSize: 11, fontWeight: "900", marginTop: 4 },
  activityAmount: { color: "#dbeafe", fontWeight: "900" },
});
