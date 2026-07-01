import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";
import { money } from "../presentation/formatters";
import type { OrderMode } from "../services/orderService";

export type Position = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  amount: number;
  probability: number;
};

export type PortfolioActivity = {
  id: string;
  action: "opened" | "closed" | "canceled";
  title: string;
  outcome: string;
  amount: number;
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
  estimatedPnl: string;
  closePosition: string;
  recentActivity: string;
  openedPosition: string;
  closedPosition: string;
  canceledOrder: string;
  openOrders: string;
  remaining: string;
  cancelOrder: string;
  portfolioSyncing: string;
  portfolioSynced: string;
  portfolioSyncError: string;
  portfolioSyncFallback: string;
  orderPlaced: string;
  openPositions: string;
  activityCount: string;
  closedTrades: string;
};

const currentProbability = (position: Position) => {
  const movement = position.side === "buy" ? 3 : -3;
  return Math.max(1, Math.min(99, position.probability + movement));
};

export const portfolioPositionValue = (position: Position) => {
  const entry = Math.max(1, position.probability);
  return position.amount * (currentProbability(position) / entry);
};

const estimatedPnl = (position: Position) => {
  const value = portfolioPositionValue(position);
  return position.side === "buy" ? value - position.amount : position.amount - value;
};

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
      <View accessibilityLabel="portfolio-position-count" testID="portfolio-position-count" style={styles.positionCountCard}>
        <Text style={styles.positionCountLabel}>{t.openPositions}</Text>
        <Text style={styles.positionCountValue}>{positions.length}</Text>
      </View>
      <View accessibilityLabel="portfolio-activity-count" testID="portfolio-activity-count" style={styles.positionCountCard}>
        <Text style={styles.positionCountLabel}>{t.activityCount}</Text>
        <Text style={styles.positionCountValue}>{activities.length}</Text>
      </View>
      <View accessibilityLabel="portfolio-closed-count" testID="portfolio-closed-count" style={styles.positionCountCard}>
        <Text style={styles.positionCountLabel}>{t.closedTrades}</Text>
        <Text style={styles.positionCountValue}>{closedActivityCount}</Text>
      </View>
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
              <Pressable
                accessibilityLabel={`close-position-${position.id}`}
                onPress={() => closePosition(position)}
                style={styles.closeButton}
                testID={`close-position-${position.id}`}
              >
                <Text style={styles.closeButtonText}>{t.closePosition}</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
      {latestOrder && (
        <View accessibilityLabel="latest-order-card" testID="latest-order-card" style={styles.confirmationCard}>
          <View style={styles.confirmationTop}>
            <Text style={styles.confirmationTitle}>{t.orderPlaced}</Text>
            <Text style={styles.confirmationAmount}>{money(latestOrder.amount)}</Text>
          </View>
          <Text style={styles.confirmationMeta}>
            {latestOrder.mode.toUpperCase()} - {latestOrder.side === "buy" ? t.buy : t.sell} - {latestOrder.outcome}
          </Text>
          <Text style={styles.confirmationMarket}>{latestOrder.title}</Text>
        </View>
      )}
      {openOrders.length > 0 && (
        <View style={styles.openOrdersBlock}>
          <Text style={styles.openOrdersTitle}>{t.openOrders}</Text>
          {openOrders.slice(0, 5).map((order) => (
            <View key={order.id} style={styles.openOrderItem}>
              <View style={styles.openOrderMain}>
                <Text style={styles.openOrderTitle}>{order.title}</Text>
                <Text style={styles.openOrderMeta}>
                  {order.side === "buy" ? t.buy : t.sell} - {order.outcome} - {order.status}
                </Text>
              </View>
              <View style={styles.openOrderNumbers}>
                <Text style={styles.openOrderPrice}>{Math.round(order.price * 100)}%</Text>
                <Text style={styles.openOrderRemaining}>
                  {t.remaining}: {money(order.remaining)}
                </Text>
                <Pressable
                  accessibilityLabel={`cancel-open-order-${order.id}`}
                  onPress={() => cancelOpenOrder(order)}
                  style={styles.cancelOrderButton}
                  testID={`cancel-open-order-${order.id}`}
                >
                  <Text style={styles.cancelOrderText}>{t.cancelOrder}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
                <Text style={styles.activityMeta}>
                  {activity.title} - {activity.outcome}
                </Text>
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
  positionCountCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionCountLabel: { color: "#94a3b8", fontWeight: "900" },
  positionCountValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  summaryItem: { flex: 1, minHeight: 92, padding: 10, borderRadius: 10, backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  summaryLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 8 },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  positionDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionDetailItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionDetailLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  positionDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  pnlPositive: { color: "#22c55e" },
  pnlNegative: { color: "#ef4444" },
  closeButton: { marginTop: 12, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  closeButtonText: { color: "#dbeafe", fontSize: 14, fontWeight: "900" },
  confirmationCard: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#12213a", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  confirmationTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  confirmationAmount: { color: "#dbeafe", fontWeight: "900" },
  confirmationMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "900", marginTop: 8 },
  confirmationMarket: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 4 },
  openOrdersBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  openOrdersTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  openOrderItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  openOrderMain: { flex: 1 },
  openOrderTitle: { color: "#f8fafc", fontWeight: "900" },
  openOrderMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  openOrderNumbers: { alignItems: "flex-end", maxWidth: 126 },
  openOrderPrice: { color: "#dbeafe", fontWeight: "900" },
  openOrderRemaining: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 3 },
  cancelOrderButton: { minHeight: 32, paddingHorizontal: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155", marginTop: 8 },
  cancelOrderText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  activityBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  activityTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  activityIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  activityMain: { flex: 1 },
  activityAction: { color: "#f8fafc", fontWeight: "900" },
  activityMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  activityAmount: { color: "#dbeafe", fontWeight: "900" },
});
