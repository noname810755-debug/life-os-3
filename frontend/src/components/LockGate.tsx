import { useState } from "react";
import { View } from "react-native";

import { AppLogo } from "@/src/components/AppLogo";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";
import { Text } from "react-native";
import { TextInput } from "react-native";
import { Pressable } from "react-native";

const useS = makeStyles((c) => ({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, zIndex: 10000 },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: c.onSurface, marginBottom: spacing.xs },
  sub: { fontSize: 14, color: c.muted, marginBottom: spacing.xl },
  input: { fontSize: 32, letterSpacing: 16, textAlign: "center", color: c.onSurface, borderBottomWidth: 2, borderBottomColor: c.brandPrimary, paddingBottom: 8, minWidth: 180 },
  err: { color: c.error, marginTop: spacing.md, fontWeight: "700" },
}));

export function LockGate({ children }: { children: React.ReactNode }) {
  const s = useS();
  const pinEnabled = useLifeStore((st) => st.settings.pinEnabled);
  const pin = useLifeStore((st) => st.settings.pin);
  const hydrated = useLifeStore((st) => st.hydrated);
  const [unlocked, setUnlocked] = useState(false);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  const locked = hydrated && pinEnabled && !!pin && !unlocked;

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setEntry(digits);
    setError(false);
    if (digits.length === 4) {
      if (digits === pin) setUnlocked(true);
      else { setError(true); setEntry(""); }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked && (
        <View style={s.overlay}>
          <AppLogo size={72} />
          <Text style={s.title}>Life OS locked</Text>
          <Text style={s.sub}>Enter your PIN to continue</Text>
          <TextInput testID="lock-pin-input" value={entry} onChangeText={onChange} keyboardType="number-pad" secureTextEntry style={s.input} autoFocus maxLength={4} />
          {error && <Text style={s.err}>Wrong PIN, try again</Text>}
        </View>
      )}
    </View>
  );
}
