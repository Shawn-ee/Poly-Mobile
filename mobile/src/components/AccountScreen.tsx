import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { money } from "../presentation/formatters";

type AccountCopy = {
  account: string;
  accountStatus: string;
  accountId: string;
  accountTier: string;
  signedOut: string;
  signedIn: string;
  signIn: string;
  signOut: string;
  signInBody: string;
  signedInBody: string;
  demoBalance: string;
  demoBalanceBody: string;
  buy: string;
  sell: string;
  loginMethodPhone: string;
  loginMethodEmail: string;
  loginMethodGoogle: string;
  loginConnected: string;
  loginUnavailable: string;
  loginGoogleTitle: string;
  loginGoogleBody: string;
  loginGoogleConnected: string;
  loginGoogleStatusSignedOut: string;
  loginGoogleStatusConnected: string;
  preferences: string;
  languagePreference: string;
  ticketDefaultPreference: string;
  slippage: string;
  savedMarketsPreference: string;
  savedMarketsCount: string;
  openPositions: string;
  openOrders: string;
  portfolioValue: string;
  openOrderValue: string;
  totalExposure: string;
  tradingMode: string;
  tradingModeMock: string;
  tradingModeServer: string;
  profileSyncing: string;
  profileSynced: string;
  profileSyncError: string;
  profileSyncFallback: string;
};

type ProfileSyncStatus = "hidden" | "syncing" | "synced" | "error";

export function AccountScreen({
  t,
  balance,
  forceSignedIn,
  languagePreferenceValue,
  ticketDefaultAmount,
  ticketDefaultSide,
  ticketDefaultSlippage,
  profileSyncStatus,
  savedMarketCount,
  openPositionCount,
  openOrderCount,
  openOrderValue,
  totalExposure,
  portfolioValue,
  tradingMode,
  openGoogleSignIn,
  signOut,
}: {
  t: AccountCopy;
  balance: number;
  forceSignedIn?: boolean;
  languagePreferenceValue: string;
  ticketDefaultAmount: string;
  ticketDefaultSide: "buy" | "sell";
  ticketDefaultSlippage: string;
  profileSyncStatus: ProfileSyncStatus;
  savedMarketCount: number;
  openPositionCount: number;
  openOrderCount: number;
  openOrderValue: number;
  totalExposure: number;
  portfolioValue: number;
  tradingMode: "mock" | "server";
  openGoogleSignIn?: () => void;
  signOut?: () => void;
}) {
  const signedIn = Boolean(forceSignedIn);

  const profileSyncCopy =
    profileSyncStatus === "syncing"
      ? t.profileSyncing
      : profileSyncStatus === "synced"
        ? t.profileSynced
        : profileSyncStatus === "error"
          ? t.profileSyncError
          : "";
  return (
    <ScrollView accessibilityLabel="account-screen" testID="account-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name={signedIn ? "checkmark" : "person-outline"} size={30} color="#dbeafe" />
        </View>
        <View style={styles.heroMain}>
          <Text style={styles.eyebrow}>{t.accountStatus}</Text>
          <Text style={styles.title}>{signedIn ? t.signedIn : t.signedOut}</Text>
          <Text style={styles.body}>{signedIn ? t.signedInBody : t.signInBody}</Text>
        </View>
      </View>

      {signedIn && (
        <View accessibilityLabel="account-profile-card" testID="account-profile-card" style={styles.profileCard}>
          <View>
            <Text style={styles.cardLabel}>{t.accountId}</Text>
            <Text style={styles.profileName}>Holiwyn Demo</Text>
          </View>
          <Text style={styles.tier}>{t.accountTier}</Text>
        </View>
      )}

      <View
        accessibilityLabel={signedIn ? "account-login-card account-login-google-connected" : "account-login-card"}
        testID="account-login-card"
        style={styles.loginCard}
      >
        <View
          accessibilityLabel={signedIn ? "account-login-google-status-connected" : "account-login-google-status-signed-out"}
          testID="account-login-google-status-row"
          style={styles.loginTitleRow}
        >
          <Text style={styles.loginTitle}>{t.loginGoogleTitle}</Text>
          <Text style={[styles.loginStatus, signedIn ? styles.loginStatusConnected : styles.loginStatusSignedOut]}>
            {signedIn ? t.loginGoogleStatusConnected : t.loginGoogleStatusSignedOut}
          </Text>
        </View>
        {signedIn ? (
          <Pressable
            accessibilityLabel="account-login-google-connected"
            accessibilityRole="button"
            onPress={signOut}
            testID="account-login-google-connected"
            style={({ pressed }) => [styles.connectedGoogleRow, pressed && styles.connectedGoogleRowPressed]}
          >
            <Ionicons name="logo-google" size={20} color="#dbeafe" />
            <Text style={styles.connectedGoogleText}>{t.loginGoogleConnected}</Text>
            <View accessibilityLabel="account-sign-out-google" testID="account-sign-out-google" style={styles.signOutPill}>
              <Text style={styles.signOutText}>{t.signOut}</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="account-login-google"
            accessibilityRole="button"
            onPress={openGoogleSignIn}
            style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]}
            testID="account-login-google"
          >
            <Ionicons name="logo-google" size={20} color="#111827" />
            <Text style={styles.googleButtonText}>{t.loginMethodGoogle}</Text>
          </Pressable>
        )}
        <Text style={styles.loginBody}>{signedIn ? t.loginConnected : t.loginGoogleBody}</Text>
      </View>

      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.cardLabel}>{t.demoBalance}</Text>
          <Text style={styles.balanceValue}>{money(balance)}</Text>
        </View>
        <Ionicons name="wallet-outline" size={28} color="#93c5fd" />
      </View>
      <Text style={styles.helper}>{t.demoBalanceBody}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.preferences}</Text>
        {profileSyncStatus !== "hidden" && (
          <View accessibilityLabel="account-profile-sync" testID="account-profile-sync" style={styles.row}>
            <Ionicons name={profileSyncStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"} size={20} color={profileSyncStatus === "error" ? "#fbbf24" : "#93c5fd"} />
            <Text style={styles.rowText}>{profileSyncCopy}</Text>
          </View>
        )}
        {profileSyncStatus === "error" && <Text style={styles.syncFallback}>{t.profileSyncFallback}</Text>}
        <View accessibilityLabel="account-language-row" testID="account-language-row" style={styles.row}>
          <Ionicons name="language-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.languagePreference}: {languagePreferenceValue}
          </Text>
        </View>
        <View accessibilityLabel="account-saved-markets" testID="account-saved-markets" style={styles.row}>
          <Ionicons name="star-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.savedMarketsPreference}: {savedMarketCount} {t.savedMarketsCount}
          </Text>
        </View>
        <View accessibilityLabel="account-portfolio-value" testID="account-portfolio-value" style={styles.row}>
          <Ionicons name="analytics-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.portfolioValue}: {money(portfolioValue)}
          </Text>
        </View>
        <View accessibilityLabel="account-open-positions" testID="account-open-positions" style={styles.row}>
          <Ionicons name="podium-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openPositions}: {openPositionCount}
          </Text>
        </View>
        <View accessibilityLabel="account-open-orders" testID="account-open-orders" style={styles.row}>
          <Ionicons name="receipt-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openOrders}: {openOrderCount}
          </Text>
        </View>
        <View accessibilityLabel="account-open-order-value" testID="account-open-order-value" style={styles.row}>
          <Ionicons name="cash-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openOrderValue}: {money(openOrderValue)}
          </Text>
        </View>
        <View accessibilityLabel="account-total-exposure" testID="account-total-exposure" style={styles.row}>
          <Ionicons name="speedometer-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.totalExposure}: {money(totalExposure)}
          </Text>
        </View>
        <View accessibilityLabel="account-ticket-defaults" testID="account-ticket-defaults" style={styles.row}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.ticketDefaultPreference}: {ticketDefaultSide === "buy" ? t.buy : t.sell} {ticketDefaultAmount} USDT - {t.slippage} {ticketDefaultSlippage}
          </Text>
        </View>
        <View accessibilityLabel="account-trading-mode" testID="account-trading-mode" style={styles.row}>
          <Ionicons name="server-outline" size={20} color={tradingMode === "server" ? "#22c55e" : "#fbbf24"} />
          <Text style={styles.rowText}>
            {t.tradingMode}: {tradingMode === "server" ? t.tradingModeServer : t.tradingModeMock}
          </Text>
        </View>
      </View>
      <Text accessibilityLabel="account-login-unavailable" testID="account-login-unavailable" style={styles.notice}>
        {signedIn ? t.loginConnected : t.loginUnavailable}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  hero: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  avatar: { width: 54, height: 54, borderRadius: 14, backgroundColor: "#1d6dff", alignItems: "center", justifyContent: "center" },
  heroMain: { flex: 1 },
  eyebrow: { color: "#93c5fd", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 25, fontWeight: "900", marginTop: 4 },
  body: { color: "#94a3b8", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 8 },
  profileCard: { marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileName: { color: "#f8fafc", fontSize: 22, fontWeight: "900", marginTop: 5 },
  tier: { color: "#22c55e", fontWeight: "900" },
  loginCard: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", gap: 10 },
  loginTitleRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  loginTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  loginStatus: { flexShrink: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: "900", overflow: "hidden" },
  loginStatusSignedOut: { color: "#bfdbfe", backgroundColor: "#172554" },
  loginStatusConnected: { color: "#bbf7d0", backgroundColor: "#14532d" },
  googleButton: { minHeight: 54, borderRadius: 13, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  googleButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  googleButtonText: { color: "#111827", fontSize: 17, fontWeight: "900" },
  connectedGoogleRow: { minHeight: 54, borderRadius: 13, borderWidth: 1, borderColor: "#263247", backgroundColor: "#0f172a", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 10 },
  connectedGoogleRowPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  connectedGoogleText: { color: "#e5e7eb", fontSize: 17, fontWeight: "900" },
  signOutPill: { marginLeft: "auto", minHeight: 32, justifyContent: "center", borderRadius: 999, paddingHorizontal: 10, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  signOutText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  loginBody: { color: "#94a3b8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  balanceCard: { marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: "#0f1f35", borderWidth: 1, borderColor: "#28456b", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: "#93c5fd", fontWeight: "900" },
  balanceValue: { color: "#f8fafc", fontSize: 30, fontWeight: "900", marginTop: 5 },
  helper: { color: "#94a3b8", fontWeight: "700", marginTop: 8, lineHeight: 19 },
  notice: { color: "#fbbf24", fontWeight: "800", marginTop: 18, lineHeight: 19 },
  section: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  sectionTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 10 },
  row: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  rowText: { flex: 1, color: "#cbd5e1", fontWeight: "800" },
  syncFallback: { color: "#94a3b8", fontWeight: "700", lineHeight: 19, marginTop: -2, marginBottom: 8, paddingLeft: 30 },
});
