import React from "react";
import { Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 6 },
  col: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { width: "100%", borderRadius: radius.sm, backgroundColor: c.surfaceTertiary, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: radius.sm, backgroundColor: c.brandPrimary },
  label: { fontSize: 11, color: c.muted, fontWeight: "600" },
  value: { fontSize: 10, color: c.onSurfaceTertiary, fontWeight: "700" },
}));

export function BarChart({ data, height = 120, showValues }: { data: { label: string; value: number }[]; height?: number; showValues?: boolean }) {
  const s = useS();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[s.wrap, { height: height + 34 }]}>
      {data.map((d, i) => (
        <View style={s.col} key={i}>
          {showValues ? <Text style={s.value}>{d.value > 0 ? Math.round(d.value) : ""}</Text> : null}
          <View style={[s.barTrack, { height }]}>
            <View style={[s.bar, { height: Math.max(3, (d.value / max) * height) }]} />
          </View>
          <Text style={s.label} numberOfLines={1}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function Sparkline({ data, width = 120, height = 40 }: { data: number[]; width?: number; height?: number }) {
  const { colors } = useTheme();
  if (data.length < 2) return <View style={{ width, height }} />;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 6) - 3}`).join(" ");
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts} fill="none" stroke={colors.brandPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// horizontal category breakdown
export function CategoryBars({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: spacing.md }}>
      {data.map((d, i) => (
        <View key={i} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>{d.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted }}>₹{Math.round(d.value).toLocaleString()}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, width: `${(d.value / max) * 100}%`, backgroundColor: d.color || colors.brandPrimary }} />
          </View>
        </View>
      ))}
    </View>
  );
}
