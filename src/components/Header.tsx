import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";

const headerFeedbackCopy = {
  en: {
    claimed: "50 USDT demo credit queued",
    notifications: "No new notifications",
  },
  zh: {
    claimed: "\u5df2\u51c6\u590750 USDT\u6a21\u62df\u91d1",
    notifications: "\u6682\u65e0\u65b0\u901a\u77e5",
  },
};

export function Header({
  locale,
  promo,
  language,
  toggleLanguage,
  openAccount,
}: {
  locale: Locale;
  promo: string;
  language: string;
  toggleLanguage: () => void;
  openAccount: () => void;
}) {
  const [feedback, setFeedback] = useState<"claimed" | "notifications" | null>(null);
  const feedbackText = feedback ? headerFeedbackCopy[locale][feedback] : null;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>H</Text>
        </View>
        <View style={styles.headerMain}>
          <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.brand}>Holiwyn</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.subBrand}>{locale === "zh" ? "\u5229\u4e91\u4f53\u80b2" : "World Cup markets"}</Text>
        </View>
        <Pressable style={styles.langButton} onPress={toggleLanguage}>
          <Text style={styles.langText}>{language}</Text>
        </Pressable>
        <Pressable accessibilityLabel={promo} testID="header-promo-action" style={styles.promoButton} onPress={() => setFeedback("claimed")}>
          <Text style={styles.promoText}>{promo}</Text>
        </Pressable>
        <Pressable accessibilityLabel="notifications" testID="header-notifications-action" style={styles.bell} onPress={() => setFeedback("notifications")}>
          <Ionicons name="notifications-outline" color="#f8fafc" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="account" testID="header-account-action" style={styles.accountButton} onPress={openAccount}>
          <Ionicons name="person-circle-outline" color="#f8fafc" size={22} />
        </Pressable>
      </View>
      {feedbackText && (
        <View accessibilityLabel="header-action-feedback" testID="header-action-feedback" style={styles.feedbackBar}>
          <Ionicons name={feedback === "claimed" ? "checkmark-circle" : "notifications-circle-outline"} color="#bfdbfe" size={18} />
          <Text style={styles.feedbackText}>{feedbackText}</Text>
          <Pressable accessibilityLabel="dismiss-header-feedback" testID="dismiss-header-feedback" onPress={() => setFeedback(null)} style={styles.feedbackDismiss}>
            <Ionicons name="close" color="#dbeafe" size={16} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  logo: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#263247" },
  logoMark: { color: "#f8fafc", fontWeight: "900", fontSize: 24 },
  headerMain: { flex: 1, minWidth: 0 },
  brand: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  subBrand: { color: "#8ea0b8", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  langButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  langText: { color: "#cbd5e1", fontWeight: "900" },
  promoButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1d6dff" },
  promoText: { color: "#ffffff", fontWeight: "900" },
  bell: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  accountButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  feedbackBar: { marginHorizontal: 16, marginBottom: 10, minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#13233a", borderWidth: 1, borderColor: "#29476d" },
  feedbackText: { flex: 1, color: "#dbeafe", fontWeight: "900" },
  feedbackDismiss: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937" },
});
