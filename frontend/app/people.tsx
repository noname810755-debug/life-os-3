import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, IconButton, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: c.onBrandTertiary },
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted, marginTop: 1 },
}));

export default function PeopleScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const balance = (id: string) => {
    const owed = st.transactions.filter((t) => t.personId === id && t.type === "debt_in" && !t.settled).reduce((a, b) => a + b.amount, 0);
    const owe = st.transactions.filter((t) => t.personId === id && t.type === "debt_out" && !t.settled).reduce((a, b) => a + b.amount, 0);
    return owed - owe;
  };

  const submit = () => {
    if (!name.trim()) { toast("Enter a name", "error"); return; }
    st.addPerson({ name, notes });
    setName(""); setNotes(""); setAdd(false); toast("Person added");
  };

  return (
    <Screen>
      <Header title="People" back right={<IconButton name="plus" testID="people-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}>
        {st.people.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="users" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>No people yet</Text>
            <Text style={{ color: colors.muted, textAlign: "center", maxWidth: 260 }}>Add friends & family to link debts, tasks, trips and events to them.</Text>
            <PrimaryButton label="Add person" icon="plus" onPress={() => setAdd(true)} testID="people-empty-add" />
          </View>
        ) : (
          <Card>
            {st.people.map((p, i) => {
              const bal = balance(p.id);
              return (
                <Pressable key={p.id} testID={`person-${p.id}`} onPress={() => router.push(`/person/${p.id}` as any)} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={s.avatar}><Text style={s.avatarText}>{p.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{p.name}</Text>
                    <Text style={s.sub}>{p.notes || `${st.tasks.filter((t) => t.personId === p.id).length} tasks linked`}</Text>
                  </View>
                  {bal !== 0 && <Text style={{ fontWeight: "800", color: bal > 0 ? colors.success : colors.error }}>{bal > 0 ? "+" : ""}{money(bal)}</Text>}
                  <Icon name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="Add person" testID="add-person-sheet">
        <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Rahul" autoFocus />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="How you know them" />
        <PrimaryButton label="Add person" icon="plus" onPress={submit} testID="submit-person" />
      </Sheet>
    </Screen>
  );
}
