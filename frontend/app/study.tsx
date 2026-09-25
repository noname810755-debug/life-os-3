import dayjs from "dayjs";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Badge, Card, Header, IconButton, Input, PrimaryButton, ProgressBar, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { daysUntil } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  ch: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10 },
  cb: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
}));

export default function StudyScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [examDays, setExamDays] = useState<number | null>(10);
  const [chSheet, setChSheet] = useState<string | null>(null);
  const [chTitle, setChTitle] = useState("");

  const submit = () => {
    if (!name.trim()) { toast("Enter subject", "error"); return; }
    st.addSubject({ name, examDate: examDays ? dayjs().add(examDays, "day").toISOString() : undefined });
    setName(""); setAdd(false); toast("Subject added");
  };
  const addCh = () => { if (chSheet && chTitle.trim()) { st.addChapter(chSheet, chTitle.trim()); setChTitle(""); } };

  return (
    <Screen>
      <Header title="Study" back right={<IconButton name="plus" testID="study-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        {st.subjects.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="book" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>No subjects yet</Text>
            <PrimaryButton label="Add subject" icon="plus" onPress={() => setAdd(true)} testID="study-empty-add" />
          </View>
        ) : st.subjects.map((sub) => {
          const done = sub.chapters.filter((c) => c.done).length;
          const prog = sub.chapters.length ? done / sub.chapters.length : 0;
          const dd = sub.examDate ? daysUntil(sub.examDate) : null;
          return (
            <Card key={sub.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>{sub.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  {dd != null && <Badge label={dd >= 0 ? `Exam in ${dd}d` : "Exam done"} tone={dd >= 0 && dd <= 7 ? "error" : "brand"} />}
                  <Pressable testID={`subject-del-${sub.id}`} onPress={() => { st.removeSubject(sub.id); toast("Deleted"); }} hitSlop={6}><Icon name="trash" size={18} color={colors.muted} /></Pressable>
                </View>
              </View>
              <ProgressBar value={prog} />
              <Text style={{ color: colors.muted, fontWeight: "700", marginTop: 6 }}>{done}/{sub.chapters.length} chapters</Text>
              {sub.chapters.map((c) => (
                <View key={c.id} style={s.ch}>
                  <Pressable testID={`ch-done-${c.id}`} onPress={() => st.toggleChapter(sub.id, c.id)} style={[s.cb, { borderColor: c.done ? colors.brandPrimary : colors.borderStrong, backgroundColor: c.done ? colors.brandPrimary : "transparent" }]}>{c.done && <Icon name="check" size={15} color={colors.onBrandPrimary} />}</Pressable>
                  <Text style={{ flex: 1, color: c.done ? colors.muted : colors.onSurface, textDecorationLine: c.done ? "line-through" : "none", fontWeight: "600" }}>{c.title}</Text>
                  <Pressable testID={`ch-weak-${c.id}`} onPress={() => st.toggleWeak(sub.id, c.id)}><Icon name="flag" size={18} color={c.weak ? colors.error : colors.muted} /></Pressable>
                </View>
              ))}
              <Pressable testID={`add-ch-${sub.id}`} onPress={() => setChSheet(sub.id)} style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: spacing.sm }}>
                <Icon name="plus" size={16} color={colors.brandPrimary} /><Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>Add chapter</Text>
              </Pressable>
            </Card>
          );
        })}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="New subject" testID="add-subject-sheet">
        <Input label="Subject" value={name} onChangeText={setName} placeholder="e.g. Physics" autoFocus />
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Exam in</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{[{ l: "7 days", v: 7 }, { l: "10 days", v: 10 }, { l: "30 days", v: 30 }, { l: "None", v: null }].map((o) => <Pressable key={o.l} onPress={() => setExamDays(o.v)} style={{ paddingHorizontal: 16, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: examDays === o.v ? colors.brandPrimary : colors.surfaceTertiary }}><Text style={{ fontWeight: "700", color: examDays === o.v ? colors.onBrandPrimary : colors.onSurfaceTertiary }}>{o.l}</Text></Pressable>)}</View>
        <PrimaryButton label="Add subject" icon="book" onPress={submit} testID="submit-subject" />
      </Sheet>

      <Sheet visible={!!chSheet} onClose={() => setChSheet(null)} title="Add chapter" testID="add-ch-sheet">
        <Input value={chTitle} onChangeText={setChTitle} placeholder="e.g. Optics" autoFocus onSubmitEditing={addCh} returnKeyType="done" />
        <PrimaryButton label="Add chapter" icon="plus" onPress={addCh} testID="ch-submit" />
      </Sheet>
    </Screen>
  );
}
