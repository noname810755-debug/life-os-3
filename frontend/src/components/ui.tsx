import React, { ReactNode } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView as NativeKeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Icon, IconName } from "./Icon";

const useS = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: c.surface, borderBottomWidth: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 40 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: c.onSurface, flex: 1, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: c.muted, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface, letterSpacing: -0.3 },
  sectionAction: { fontSize: 14, fontWeight: "700", color: c.brandPrimary },
  primaryBtn: { backgroundColor: c.brandPrimary, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm },
  primaryBtnText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "800" },
  ghostBtn: { backgroundColor: c.surfaceTertiary, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: spacing.lg, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  ghostBtnText: { color: c.onSurface, fontSize: 16, fontWeight: "700" },
  chip: { height: 36, borderRadius: radius.pill, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", flexShrink: 0, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "700" },
  input: { backgroundColor: c.surfaceTertiary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: c.onSurface, borderWidth: 1, borderColor: c.border },
  inputLabel: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary, marginBottom: spacing.xs, marginLeft: 2 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, gap: spacing.md },
  emptyIcon: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: c.onSurface },
  emptySub: { fontSize: 14, color: c.muted, textAlign: "center", maxWidth: 280, lineHeight: 20 },
  statCard: { flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: c.border },
  statValue: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: 6 },
  statLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: c.brandPrimary },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
}));

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useS();
  const insets = useSafeAreaInsets();
  return <NativeKeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[s.screen, { paddingTop: insets.top }, style]}>{children}</NativeKeyboardAvoidingView>;
}

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={s.header}>
      <View style={s.headerRow}>
        {back && (
          <Pressable testID="header-back" onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
            <Icon name="chevron-left" size={22} color={colors.onSurface} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function IconButton({ name, onPress, color, testID, bg }: { name: IconName; onPress: () => void; color?: string; testID?: string; bg?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={[s.iconBtn, bg ? { backgroundColor: bg, borderColor: bg } : null]} hitSlop={8}>
      <Icon name={name} size={20} color={color || colors.onSurface} />
    </Pressable>
  );
}

export function Card({ children, style, onPress, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; testID?: string }) {
  const s = useS();
  if (onPress) return <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.7 }]}>{children}</Pressable>;
  return <View testID={testID} style={[s.card, style]}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const s = useS();
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} testID={`section-action-${title}`}><Text style={s.sectionAction}>{actionLabel}</Text></Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon, testID, disabled, loading }: { label: string; onPress: () => void; icon?: IconName; testID?: string; disabled?: boolean; loading?: boolean }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [s.primaryBtn, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}>
      {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <>{icon && <Icon name={icon} size={18} color={colors.onBrandPrimary} />}<Text style={s.primaryBtnText}>{label}</Text></>}
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon, testID }: { label: string; onPress: () => void; icon?: IconName; testID?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.7 }]}>
      {icon && <Icon name={icon} size={18} color={colors.onSurface} />}<Text style={s.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, testID }: { label: string; active?: boolean; onPress: () => void; testID?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={[s.chip, { backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary, borderColor: active ? colors.brandPrimary : colors.border }]}>
      <Text style={[s.chipText, { color: active ? colors.onBrandPrimary : colors.onSurfaceTertiary }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }} style={{ maxHeight: 56 }}>
      {children}
    </ScrollView>
  );
}

export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} style={s.input} {...props} />
    </View>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon: IconName; title: string; subtitle?: string; action?: ReactNode }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Icon name={icon} size={32} color={colors.brandPrimary} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySub}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

export function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return (
    <View style={s.statCard}>
      <Icon name={icon} size={20} color={color || colors.brandPrimary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const s = useS();
  const { colors } = useTheme();
  return <View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.min(100, Math.max(0, value * 100))}%`, backgroundColor: color || colors.brandPrimary }]} /></View>;
}

export function Badge({ label, tone = "brand" }: { label: string; tone?: "brand" | "success" | "warning" | "error" | "muted" }) {
  const s = useS();
  const { colors } = useTheme();
  const map = {
    brand: { bg: colors.brandTertiary, fg: colors.onBrandTertiary },
    success: { bg: colors.surfaceTertiary, fg: colors.success },
    warning: { bg: colors.surfaceTertiary, fg: colors.warning },
    error: { bg: colors.surfaceTertiary, fg: colors.error },
    muted: { bg: colors.surfaceTertiary, fg: colors.muted },
  }[tone];
  return <View style={[s.badge, { backgroundColor: map.bg }]}><Text style={[s.badgeText, { color: map.fg }]}>{label}</Text></View>;
}

export function Sheet({ visible, onClose, title, children, testID }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode; testID?: string }) {
  const s = useS();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={s.backdrop} onPress={onClose} testID={testID ? `${testID}-backdrop` : "sheet-backdrop"}>
          <Pressable style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg, maxHeight: "88%" }]} onPress={(e) => e.stopPropagation()} testID={testID}>
            <View style={s.sheetHandle} />
            {title ? <Text style={s.sheetTitle}>{title}</Text> : null}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
