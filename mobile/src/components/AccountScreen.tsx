import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
  loginMethodPhone: string;
  loginMethodEmail: string;
  loginConnected: string;
  loginUnavailable: string;
  preferences: string;
  languagePreference: string;
  security: string;
  mockOnly: string;
};

export function AccountScreen({
  t,
  balance,
}: {
  t: AccountCopy;
  balance: number;
}) {
  const [signedIn, setSignedIn] = useState(false);

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

      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.cardLabel}>{t.demoBalance}</Text>
          <Text style={styles.balanceValue}>{money(balance)}</Text>
        </View>
        <Ionicons name="wallet-outline" size={28} color="#93c5fd" />
      </View>
      <Text style={styles.helper}>{t.demoBalanceBody}</Text>

      <View style={styles.actions}>
        {signedIn ? (
          <Pressable accessibilityLabel="account-sign-out" testID="account-sign-out" style={styles.secondaryButton} onPress={() => setSignedIn(false)}>
            <Ionicons name="log-out-outline" size={20} color="#dbeafe" />
            <Text style={styles.secondaryText}>{t.signOut}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable accessibilityLabel="account-login-phone" testID="account-login-phone" style={styles.primaryButton} onPress={() => setSignedIn(true)}>
              <Ionicons name="phone-portrait-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryText}>{t.loginMethodPhone}</Text>
            </Pressable>
            <Pressable accessibilityLabel="account-login-email" testID="account-login-email" style={styles.secondaryButton} onPress={() => setSignedIn(true)}>
              <Ionicons name="mail-outline" size={20} color="#dbeafe" />
              <Text style={styles.secondaryText}>{t.loginMethodEmail}</Text>
            </Pressable>
          </>
        )}
      </View>
      <Text accessibilityLabel="account-login-unavailable" testID="account-login-unavailable" style={styles.notice}>
        {signedIn ? t.loginConnected : t.loginUnavailable}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.preferences}</Text>
        <View style={styles.row}>
          <Ionicons name="language-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>{t.languagePreference}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>{t.security}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color="#fbbf24" />
          <Text style={styles.rowText}>{t.mockOnly}</Text>
        </View>
      </View>
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
  balanceCard: { marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: "#0f1f35", borderWidth: 1, borderColor: "#28456b", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: "#93c5fd", fontWeight: "900" },
  balanceValue: { color: "#f8fafc", fontSize: 30, fontWeight: "900", marginTop: 5 },
  helper: { color: "#94a3b8", fontWeight: "700", marginTop: 8, lineHeight: 19 },
  actions: { gap: 10, marginTop: 18 },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: "#1d6dff", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  secondaryButton: { height: 54, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryText: { color: "#dbeafe", fontSize: 16, fontWeight: "900" },
  notice: { color: "#fbbf24", fontWeight: "800", marginTop: 10, lineHeight: 19 },
  section: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  sectionTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 10 },
  row: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  rowText: { flex: 1, color: "#cbd5e1", fontWeight: "800" },
});
