import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Icon } from "@/src/components/Icon";
import { Card, Chip, Header, PrimaryButton, Screen } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { parseCommand, SAMPLE_COMMANDS } from "@/src/lib/nlp";
import { DraftAction } from "@/src/store/types";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  inputWrap: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.md, marginHorizontal: spacing.lg },
  input: { fontSize: 17, color: c.onSurface, minHeight: 80, textAlignVertical: "top", lineHeight: 24 },
  hint: { fontSize: 13, color: c.muted, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs },
  draftCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  draftIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  draftTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  draftDetail: { fontSize: 13, color: c.muted, marginTop: 1 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  warn: { flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: c.surfaceTertiary, padding: spacing.md, borderRadius: radius.md, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  warnText: { flex: 1, fontSize: 13, color: c.onSurfaceTertiary, fontWeight: "600" },
}));

export default function CommandScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const store = useLifeStore();
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftAction[]>([]);

  const handleParse = (input?: string) => {
    const value = (input ?? text).trim();
    if (!value) return;
    const result = parseCommand(value);
    setText(value);
    setDrafts(result);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (result.length === 0) toast("I could not understand that. Add a little more detail.", "error");
  };

  const toggle = (id: string) => setDrafts((d) => d.map((a) => (a.id === id ? { ...a, include: !a.include } : a)));

  const confirm = () => {
    const included = drafts.filter((d) => d.include);
    if (!included.length) return;
    store.applyActions(drafts);
    toast(`${included.length} action${included.length > 1 ? "s" : ""} added to your Life OS`, "success");
    setText("");
    setDrafts([]);
  };

  const hasSensitive = drafts.some((d) => d.include && d.sensitive);
  const iconColor: Record<string, string> = { txn: colors.success, task: colors.brandPrimary, event: "#8B5CF6", trip: "#E23B7B", goal: colors.brandPrimary, habit: "#0EA5A5" };

  return (
    <Screen>
      <Header title="Command" subtitle="Describe it, and Life OS will organize it" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={s.inputWrap}>
          <TextInput
            testID="command-input"
            value={text}
            onChangeText={setText}
            placeholder="e.g. Schedule the gym tomorrow at 7 AM, remind me to call Rahul, and plan a Jaipur trip for ₹6,000"
            placeholderTextColor={colors.muted}
            style={s.input}
            multiline
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.sm }}>
            {text.length > 0 && (
              <Pressable testID="command-inbox" onPress={() => { store.addInbox(text); toast("Saved to Smart Inbox"); setText(""); setDrafts([]); }} style={{ paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="inbox" size={16} color={colors.onSurfaceTertiary} /><Text style={{ fontWeight: "700", color: colors.onSurfaceTertiary }}>Inbox</Text>
              </Pressable>
            )}
            <Pressable testID="command-parse" onPress={() => handleParse()} style={{ paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.brandPrimary, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="sparkles" size={16} color={colors.onBrandPrimary} /><Text style={{ fontWeight: "800", color: colors.onBrandPrimary }}>Understand</Text>
            </Pressable>
          </View>
        </View>

        {drafts.length === 0 ? (
          <>
            <Text style={s.hint}>Try these</Text>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              {SAMPLE_COMMANDS.map((c) => (
                <Pressable key={c} testID={`sample-${c.slice(0, 8)}`} onPress={() => handleParse(c)}>
                  <Card style={{ padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Icon name="command" size={18} color={colors.brandPrimary} />
                    <Text style={{ flex: 1, color: colors.onSurface, fontSize: 14, fontWeight: "600" }}>{c}</Text>
                    <Icon name="arrow-right" size={16} color={colors.muted} />
                  </Card>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Text style={s.hint}>I understood {drafts.length} thing{drafts.length > 1 ? "s" : ""} — review & confirm</Text>
            {drafts.map((d) => (
              <Pressable key={d.id} testID={`draft-${d.id}`} onPress={() => toggle(d.id)} style={[s.draftCard, { backgroundColor: colors.surfaceSecondary, borderColor: d.include ? (d.sensitive ? colors.warning : colors.brandPrimary) : colors.border }]}>
                <View style={[s.draftIcon, { backgroundColor: colors.surfaceTertiary }]}><Icon name={d.icon as any} size={20} color={iconColor[d.type] || colors.brandPrimary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.draftTitle}>{d.title}</Text>
                  <Text style={s.draftDetail}>{d.detail}{d.sensitive ? "  •  needs confirmation" : ""}</Text>
                </View>
                <View style={[s.check, { borderColor: d.include ? colors.brandPrimary : colors.borderStrong, backgroundColor: d.include ? colors.brandPrimary : "transparent" }]}>
                  {d.include && <Icon name="check" size={16} color={colors.onBrandPrimary} />}
                </View>
              </Pressable>
            ))}
            {hasSensitive && (
              <View style={s.warn}>
                <Icon name="shield" size={18} color={colors.warning} />
                <Text style={s.warnText}>{"Money entries need your confirmation. Uncheck anything you don't want saved."}</Text>
              </View>
            )}
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton testID="command-confirm" label={`Confirm & save ${drafts.filter((d) => d.include).length}`} icon="check" onPress={confirm} />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
