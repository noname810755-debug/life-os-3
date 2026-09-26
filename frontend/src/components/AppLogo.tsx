import Svg, { Circle, Line, Path } from "react-native-svg";
import { Text, View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  mark: { alignItems: "center", justifyContent: "center", backgroundColor: c.brandPrimary, overflow: "hidden" },
}));

export function AppLogo({ size = 64, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  const s = useS();
  const { colors } = useTheme();
  const iconSize = size * 0.56;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={[s.mark, { width: size, height: size, borderRadius: Math.max(16, size * 0.28) }]}>
        <Svg width={iconSize} height={iconSize} viewBox="0 0 48 48">
          <Line x1="24" y1="24" x2="11" y2="12" stroke={colors.onBrandPrimary} strokeWidth="3" strokeLinecap="round" />
          <Line x1="24" y1="24" x2="37" y2="12" stroke={colors.onBrandPrimary} strokeWidth="3" strokeLinecap="round" />
          <Line x1="24" y1="24" x2="37" y2="37" stroke={colors.onBrandPrimary} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="24" cy="24" r="8" fill={colors.onBrandPrimary} />
          <Circle cx="11" cy="12" r="5" fill={colors.onBrandPrimary} />
          <Circle cx="37" cy="12" r="5" fill={colors.onBrandPrimary} />
          <Circle cx="37" cy="37" r="5" fill={colors.onBrandPrimary} />
          <Path d="M24 19.5v9M19.5 24h9" stroke={colors.brandPrimary} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      </View>
      {showWordmark && <Text style={{ color: colors.onSurface, fontSize: Math.max(16, size * 0.34), fontWeight: "800" }}>Life OS</Text>}
    </View>
  );
}
