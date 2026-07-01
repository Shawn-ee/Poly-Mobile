import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";

export function Header({
  locale,
  promo,
  language,
  toggleLanguage,
}: {
  locale: Locale;
  promo: string;
  language: string;
  toggleLanguage: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.logo}>
        <Text style={styles.logoMark}>H</Text>
      </View>
      <View style={styles.headerMain}>
        <Text style={styles.brand}>Holiwyn</Text>
        <Text style={styles.subBrand}>{locale === "zh" ? "\u5229\u4e91\u4f53\u80b2" : "World Cup markets"}</Text>
      </View>
      <Pressable style={styles.langButton} onPress={toggleLanguage}>
        <Text style={styles.langText}>{language}</Text>
      </Pressable>
      <Pressable style={styles.promoButton}>
        <Text style={styles.promoText}>{promo}</Text>
      </Pressable>
      <Pressable style={styles.bell}>
        <Ionicons name="notifications-outline" color="#f8fafc" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  logo: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#263247" },
  logoMark: { color: "#f8fafc", fontWeight: "900", fontSize: 24 },
  headerMain: { flex: 1 },
  brand: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  subBrand: { color: "#8ea0b8", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  langButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  langText: { color: "#cbd5e1", fontWeight: "900" },
  promoButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1d6dff" },
  promoText: { color: "#ffffff", fontWeight: "900" },
  bell: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
});
