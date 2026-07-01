import { Pressable, StyleSheet, Text, View } from "react-native";

export type WorldCupTab = "games" | "futures";

export function WorldCupSegmented({
  left,
  right,
  value,
  setValue,
}: {
  left: string;
  right: string;
  value: WorldCupTab;
  setValue: (tab: WorldCupTab) => void;
}) {
  return (
    <View style={styles.segmented}>
      <Pressable
        accessibilityLabel="world-cup-games-tab"
        onPress={() => setValue("games")}
        style={[styles.segment, value === "games" && styles.segmentActive]}
        testID="world-cup-games-tab"
      >
        <Text style={[styles.segmentText, value === "games" && styles.segmentTextActive]}>{left}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="world-cup-futures-tab"
        onPress={() => setValue("futures")}
        style={[styles.segment, value === "futures" && styles.segmentActive]}
        testID="world-cup-futures-tab"
      >
        <Text style={[styles.segmentText, value === "futures" && styles.segmentTextActive]}>{right}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#263247", marginBottom: 10 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 14 },
  segmentActive: { borderBottomWidth: 3, borderBottomColor: "#f8fafc" },
  segmentText: { color: "#8ea0b8", fontSize: 18, fontWeight: "800" },
  segmentTextActive: { color: "#f8fafc" },
});
