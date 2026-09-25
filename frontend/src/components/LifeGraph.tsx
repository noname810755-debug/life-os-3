import React, { useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";

import { Icon, IconName } from "@/src/components/Icon";
import { GraphEdge, GraphNode, NodeKind } from "@/src/lib/graph";
import { makeStyles, useTheme } from "@/src/theme";

const CANVAS = 1000;

function iconFor(node: GraphNode): IconName {
  const kind = node.kind === "hub" ? (node.id.replace("hub:", "") as NodeKind) : node.kind;
  const map: Record<string, IconName> = {
    you: "star", person: "user", money: "wallet", task: "check", event: "calendar",
    goal: "target", habit: "repeat", trip: "plane", study: "book", fitness: "activity",
  };
  return map[kind] || "circle";
}

function colorFor(kind: NodeKind, id: string, colors: any): string {
  const k = kind === "hub" ? id.replace("hub:", "") : kind;
  const map: Record<string, string> = {
    you: colors.brandPrimary, person: "#2B6BE4", money: "#1E9E5A", task: "#E08A00",
    event: "#8B5CF6", goal: "#FF5E00", habit: "#0EA5A5", trip: "#E23B7B", study: "#6366F1", fitness: "#16A34A",
  };
  return map[k] || colors.muted;
}

const useS = makeStyles((c) => ({
  node: { position: "absolute", alignItems: "center", justifyContent: "center" },
  circle: { alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.surface },
  label: { position: "absolute", textAlign: "center", fontSize: 12, fontWeight: "700", color: c.onSurface },
}));

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeTap: (node: GraphNode) => void;
  highlightId?: string | null;
}

export function LifeGraph({ nodes, edges, onNodeTap, highlightId }: Props) {
  const s = useS();
  const { colors } = useTheme();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(0.62);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const savedScale = useSharedValue(0.62);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const inited = useRef(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    if (!inited.current && width > 0) {
      inited.current = true;
      tx.value = width / 2 - CANVAS / 2;
      ty.value = height / 2 - CANVAS / 2;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    }
  };

  const pan = Gesture.Pan().minDistance(6).onUpdate((e) => {
    tx.value = savedTx.value + e.translationX;
    ty.value = savedTy.value + e.translationY;
  }).onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const pinch = Gesture.Pinch().onUpdate((e) => {
    const next = savedScale.value * e.scale;
    scale.value = Math.min(2.6, Math.max(0.35, next));
  }).onEnd(() => { savedScale.value = scale.value; });

  const composed = Gesture.Simultaneous(pan, pinch);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const posMap: Record<string, GraphNode> = {};
  nodes.forEach((n) => (posMap[n.id] = n));

  const zoom = (dir: number) => {
    "worklet";
    const next = savedScale.value * (dir > 0 ? 1.3 : 0.77);
    scale.value = Math.min(2.6, Math.max(0.35, next));
    savedScale.value = scale.value;
  };

  return (
    <View style={{ flex: 1, overflow: "hidden" }} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ position: "absolute", width: CANVAS, height: CANVAS }, animStyle]}>
          <Svg width={CANVAS} height={CANVAS} style={{ position: "absolute" }}>
            {edges.map((e, i) => {
              const a = posMap[e.from], b = posMap[e.to];
              if (!a || !b) return null;
              return <Line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.borderStrong} strokeWidth={1.5} />;
            })}
          </Svg>
          {nodes.map((n) => {
            const col = colorFor(n.kind, n.id, colors);
            const hl = highlightId === n.id;
            return (
              <React.Fragment key={n.id}>
                <Pressable
                  testID={`graph-node-${n.id}`}
                  onPress={() => onNodeTap(n)}
                  style={[s.node, { left: n.x - n.r, top: n.y - n.r, width: n.r * 2, height: n.r * 2 }]}
                >
                  <View style={[s.circle, { width: n.r * 2, height: n.r * 2, borderRadius: n.r, backgroundColor: col, borderWidth: hl ? 4 : 2, borderColor: hl ? colors.onSurface : colors.surface }]}>
                    <Icon name={iconFor(n)} size={n.r} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                </Pressable>
                <Text style={[s.label, { left: n.x - 55, top: n.y + n.r + 3, width: 110, fontSize: n.depth === 0 ? 14 : 12 }]} numberOfLines={1}>
                  {n.label}
                </Text>
              </React.Fragment>
            );
          })}
        </Animated.View>
      </GestureDetector>

      <View style={{ position: "absolute", right: 12, bottom: 12, gap: 8 }}>
        <Pressable testID="graph-zoom-in" onPress={() => zoom(1)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <Icon name="zoom-in" size={22} color={colors.onSurface} />
        </Pressable>
        <Pressable testID="graph-zoom-out" onPress={() => zoom(-1)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <Icon name="zoom-out" size={22} color={colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}
