import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { relative } from "@/src/lib/date";
import { parseCommand } from "@/src/lib/nlp";
import { DraftAction } from "@/src/store/types";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  item: { gap: spacing.sm },
  text: { fontSize: 15, color: c.onSurface, fontWeight: "600", lineHeight: 21 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: radius.md },
  draftCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
}));

export default function InboxScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [capture, setCapture] = useState("");
  const [processing, setProcessing] = useState<{ inboxId: string; drafts: DraftAction[] } | null>(null);

  const items = st.inbox.filter((i) => !i.processed);

  const process = (id: string, text: string) => {
    const drafts = parseCommand(text);
    if (!drafts.length) { toast("Couldn't extract anything — edit & retry", "error"); return; }
    setProcessing({ inboxId: id, drafts });
  };

  const confirm = () => {
    if (!processing) return;
    st.applyActions(processing.drafts);
    st.removeInbox(processing.inboxId);
    toast("Processed into your Life OS");
    setProcessing(null);
  };

  const toggle = (id: string) => setProcessing((p) => p && ({ ...p, drafts: p.drafts.map((d) => (d.id === id ? { ...d, include: !d.include } : d)) }));

  return (
    <Screen>
      <Header title="Smart Inbox" back subtitle="Capture now, sort later" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        <Card>
          <Input value={capture} onChangeText={setCapture} placeholder="Dump anything on your mind…" label="Quick capture" />
          <PrimaryButton label="Add to inbox" icon="inbox" onPress={() => { if (capture.trim()) { st.addInbox(capture); setCapture(""); toast("Captured"); } }} testID="inbox-capture" />
        </Card>

        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="inbox" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>Inbox zero 🎉</Text>
            <Text style={{ color: colors.muted, textAlign: "center", maxWidth: 260 }}>Anything you capture lands here. AI turns it into tasks, expenses, trips & more.</Text>
          </View>
        ) : items.map((it) => (
          <Card key={it.id} style={s.item}>
            <Text style={s.text}>{it.text}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{relative(it.createdAt)}</Text>
            <View style={s.actions}>
              <Pressable testID={`inbox-process-${it.id}`} onPress={() => process(it.id, it.text)} style={[s.btn, { backgroundColor: colors.brandPrimary }]}><Icon name="sparkles" size={16} color={colors.onBrandPrimary} /><Text style={{ color: colors.onBrandPrimary, fontWeight: "800" }}>Process</Text></Pressable>
              <Pressable testID={`inbox-del-${it.id}`} onPress={() => { st.removeInbox(it.id); toast("Removed"); }} style={[s.btn, { backgroundColor: colors.surfaceTertiary, flex: 0, paddingHorizontal: 16 }]}><Icon name="trash" size={16} color={colors.onSurface} /></Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>

      <Sheet visible={!!processing} onClose={() => setProcessing(null)} title="Review & confirm" testID="inbox-process-sheet">
        {processing?.drafts.map((d) => (
          <Pressable key={d.id} testID={`indraft-${d.id}`} onPress={() => toggle(d.id)} style={[s.draftCard, { backgroundColor: colors.surfaceSecondary, borderColor: d.include ? colors.brandPrimary : colors.border }]}>
            <Icon name={d.icon as any} size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}><Text style={{ fontWeight: "800", color: colors.onSurface }}>{d.title}</Text><Text style={{ color: colors.muted, fontSize: 13 }}>{d.detail}</Text></View>
            <View style={[s.check, { borderColor: d.include ? colors.brandPrimary : colors.borderStrong, backgroundColor: d.include ? colors.brandPrimary : "transparent" }]}>{d.include && <Icon name="check" size={14} color={colors.onBrandPrimary} />}</View>
          </Pressable>
        ))}
        <PrimaryButton label="Confirm & save" icon="check" onPress={confirm} testID="inbox-confirm" />
      </Sheet>
    </Screen>
  );
}
