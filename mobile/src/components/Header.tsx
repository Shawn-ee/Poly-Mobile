import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";

export function Header({
  locale,
  language,
  toggleLanguage,
}: {
  locale: Locale;
  language: string;
  toggleLanguage: () => void;
}) {
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
          <Ionicons name="language-outline" color="#cbd5e1" size={18} />
          <Text style={styles.langText}>{language}</Text>
        </Pressable>
      </View>
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
  langButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  langText: { color: "#cbd5e1", fontWeight: "900" },
});
