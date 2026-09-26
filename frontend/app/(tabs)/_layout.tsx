import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Icon, IconName } from "@/src/components/Icon";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const TABS: { name: string; label: string; icon: IconName; center?: boolean }[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "life", label: "Life", icon: "graph" },
  { name: "command", label: "Command", icon: "command", center: true },
  { name: "workspaces", label: "Spaces", icon: "grid" },
  { name: "profile", label: "Profile", icon: "user" },
];

const useS = makeStyles((c) => ({
  bar: { flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 11, fontWeight: "700" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerBtn: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: -22, shadowColor: c.brand, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  centerLabel: { fontSize: 10, fontWeight: "800", marginTop: 2 },
}));

function CustomTabBar({ state, navigation }: any) {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: insets.bottom + 6 }]}>
      {TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const focused = state.index === routeIndex;
        const onPress = () => {
          Haptics.selectionAsync().catch(() => {});
          const event = navigation.emit({ type: "tabPress", target: state.routes[routeIndex]?.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
        };
        if (tab.center) {
          return (
            <View key={tab.name} style={s.centerWrap}>
              <Pressable testID="tab-command" onPress={onPress} style={s.centerBtn}>
                <Icon name={tab.icon} size={26} color={colors.onBrandPrimary} />
              </Pressable>
              <Text style={[s.centerLabel, { color: focused ? colors.brandPrimary : colors.muted }]}>{tab.label}</Text>
            </View>
          );
        }
        return (
          <Pressable key={tab.name} testID={`tab-${tab.name}`} onPress={onPress} style={s.item}>
            <Icon name={tab.icon} size={24} color={focused ? colors.brandPrimary : colors.muted} strokeWidth={focused ? 2.4 : 2} />
            <Text style={[s.label, { color: focused ? colors.brandPrimary : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="index" tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="life" />
      <Tabs.Screen name="command" />
      <Tabs.Screen name="workspaces" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
