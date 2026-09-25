import React from "react";
import Svg, { Circle, Line, Path, Rect, Polyline } from "react-native-svg";
import { useTheme } from "@/src/theme";

export type IconName =
  | "home" | "command" | "graph" | "grid" | "user" | "users" | "plus" | "close" | "check"
  | "check-circle" | "circle" | "calendar" | "wallet" | "rupee" | "target" | "repeat" | "plane"
  | "book" | "activity" | "search" | "bell" | "chevron-right" | "chevron-left" | "chevron-down"
  | "arrow-right" | "trash" | "edit" | "inbox" | "clock" | "trending-up" | "trending-down"
  | "alert" | "settings" | "lock" | "sun" | "moon" | "filter" | "zoom-in" | "zoom-out"
  | "briefcase" | "car" | "package" | "heart" | "list" | "mic" | "camera" | "flag" | "pie"
  | "water" | "dots" | "shield" | "download" | "flame" | "map-pin" | "play" | "pause" | "star"
  | "sparkles" | "minus" | "wand";

interface Props { name: IconName; size?: number; color?: string; strokeWidth?: number; }

export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const { colors } = useTheme();
  const c = color || colors.onSurface;
  const p = { stroke: c, strokeWidth, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const body = (() => {
    switch (name) {
      case "home": return <Path {...p} d="M4 10.5 L12 4 L20 10.5 V20 H4 Z" />;
      case "command": case "wand": case "sparkles":
        return <><Path {...p} d="M12 3 L13.6 9.2 L20 12 L13.6 14.8 L12 21 L10.4 14.8 L4 12 L10.4 9.2 Z" /><Path {...p} d="M18.5 4 L19 6 L21 6.5 L19 7 L18.5 9 L18 7 L16 6.5 L18 6 Z" /></>;
      case "graph": return <><Circle {...p} cx={6} cy={6} r={2.4} /><Circle {...p} cx={18} cy={7} r={2.4} /><Circle {...p} cx={10} cy={18} r={2.4} /><Line {...p} x1={7.6} y1={7.2} x2={8.6} y2={16.2} /><Line {...p} x1={8} y1={6.4} x2={16} y2={6.8} /><Line {...p} x1={16.4} y1={8.4} x2={11.4} y2={16.6} /></>;
      case "grid": return <><Rect {...p} x={3} y={3} width={7.5} height={7.5} rx={2} /><Rect {...p} x={13.5} y={3} width={7.5} height={7.5} rx={2} /><Rect {...p} x={3} y={13.5} width={7.5} height={7.5} rx={2} /><Rect {...p} x={13.5} y={13.5} width={7.5} height={7.5} rx={2} /></>;
      case "user": return <><Circle {...p} cx={12} cy={8} r={3.5} /><Path {...p} d="M5 20 c0-4 3.5-6 7-6 s7 2 7 6" /></>;
      case "users": return <><Circle {...p} cx={9} cy={8} r={3} /><Path {...p} d="M3 20 c0-3.5 3-5 6-5 s6 1.5 6 5" /><Path {...p} d="M16 6 a3 3 0 0 1 0 6 M17 15 c2 0.6 4 2 4 5" /></>;
      case "plus": return <><Line {...p} x1={12} y1={5} x2={12} y2={19} /><Line {...p} x1={5} y1={12} x2={19} y2={12} /></>;
      case "minus": return <Line {...p} x1={5} y1={12} x2={19} y2={12} />;
      case "close": return <><Line {...p} x1={6} y1={6} x2={18} y2={18} /><Line {...p} x1={18} y1={6} x2={6} y2={18} /></>;
      case "check": return <Path {...p} d="M4 12.5 l5 5 L20 6" />;
      case "check-circle": return <><Circle {...p} cx={12} cy={12} r={9} /><Path {...p} d="M8 12 l3 3 5-6" /></>;
      case "circle": return <Circle {...p} cx={12} cy={12} r={9} />;
      case "calendar": return <><Rect {...p} x={3} y={5} width={18} height={16} rx={2.5} /><Line {...p} x1={3} y1={9.5} x2={21} y2={9.5} /><Line {...p} x1={8} y1={3} x2={8} y2={6} /><Line {...p} x1={16} y1={3} x2={16} y2={6} /></>;
      case "wallet": return <><Rect {...p} x={3} y={6} width={18} height={13} rx={3} /><Path {...p} d="M16 11.5 h5 v3 h-5 a1.5 1.5 0 0 1 0-3 Z" /></>;
      case "rupee": return <><Path {...p} d="M8 6 H16 M8 9.5 H16 M8 6 c5 0 5 7 0 7 H10" /><Path {...p} d="M10 13 L16 19" /></>;
      case "target": return <><Circle {...p} cx={12} cy={12} r={8.5} /><Circle {...p} cx={12} cy={12} r={4.8} /><Circle cx={12} cy={12} r={1.8} fill={c} /></>;
      case "repeat": return <><Path {...p} d="M4 9 a5 5 0 0 1 5-5 h9" /><Polyline {...p} points="15 1 18.5 4 15 7" /><Path {...p} d="M20 15 a5 5 0 0 1 -5 5 H6" /><Polyline {...p} points="9 23 5.5 20 9 17" /></>;
      case "plane": return <Path {...p} d="M21 3 L3 10.5 L9.5 13 L11.5 19 L14 13.5 Z" />;
      case "book": return <Path {...p} d="M12 6 C12 5 9 4 5 4 V18 C9 18 12 19 12 20 C12 19 15 18 19 18 V4 C15 4 12 5 12 6 Z" />;
      case "activity": return <Path {...p} d="M3 12 H7 L10 5 L14 19 L17 12 H21" />;
      case "search": return <><Circle {...p} cx={11} cy={11} r={7} /><Line {...p} x1={16.5} y1={16.5} x2={21} y2={21} /></>;
      case "bell": return <><Path {...p} d="M6 16 V11 a6 6 0 0 1 12 0 V16 l1.5 2 H4.5 Z" /><Path {...p} d="M10 20 a2 2 0 0 0 4 0" /></>;
      case "chevron-right": return <Polyline {...p} points="9 5 16 12 9 19" />;
      case "chevron-left": return <Polyline {...p} points="15 5 8 12 15 19" />;
      case "chevron-down": return <Polyline {...p} points="5 9 12 16 19 9" />;
      case "arrow-right": return <><Line {...p} x1={4} y1={12} x2={19} y2={12} /><Polyline {...p} points="13 6 20 12 13 18" /></>;
      case "trash": return <><Line {...p} x1={4} y1={7} x2={20} y2={7} /><Path {...p} d="M8 7 V5 h8 v2 M6.5 7 l1 13 h9 l1 -13" /></>;
      case "edit": return <Path {...p} d="M4 20 h4 L19 9 l-4 -4 L4 16 Z M14 5 l4 4" />;
      case "inbox": return <><Path {...p} d="M3 13 h5 l2 3 h4 l2 -3 h5" /><Path {...p} d="M3 13 L6 5 h12 l3 8 V19 H3 Z" /></>;
      case "clock": return <><Circle {...p} cx={12} cy={12} r={9} /><Polyline {...p} points="12 7 12 12 16 14" /></>;
      case "trending-up": return <><Polyline {...p} points="3 17 9 11 13 15 21 7" /><Polyline {...p} points="15 7 21 7 21 13" /></>;
      case "trending-down": return <><Polyline {...p} points="3 7 9 13 13 9 21 17" /><Polyline {...p} points="15 17 21 17 21 11" /></>;
      case "alert": return <><Path {...p} d="M12 4 L22 20 H2 Z" /><Line {...p} x1={12} y1={10} x2={12} y2={15} /><Circle cx={12} cy={17.5} r={0.9} fill={c} /></>;
      case "settings": return <><Line {...p} x1={3} y1={7} x2={21} y2={7} /><Circle cx={8} cy={7} r={2.4} fill={c} /><Line {...p} x1={3} y1={12} x2={21} y2={12} /><Circle cx={15} cy={12} r={2.4} fill={c} /><Line {...p} x1={3} y1={17} x2={21} y2={17} /><Circle cx={11} cy={17} r={2.4} fill={c} /></>;
      case "lock": return <><Rect {...p} x={5} y={11} width={14} height={9} rx={2.5} /><Path {...p} d="M8 11 V8 a4 4 0 0 1 8 0 V11" /></>;
      case "sun": return <><Circle {...p} cx={12} cy={12} r={4} /><Line {...p} x1={12} y1={2} x2={12} y2={5} /><Line {...p} x1={12} y1={19} x2={12} y2={22} /><Line {...p} x1={2} y1={12} x2={5} y2={12} /><Line {...p} x1={19} y1={12} x2={22} y2={12} /><Line {...p} x1={5} y1={5} x2={7} y2={7} /><Line {...p} x1={17} y1={17} x2={19} y2={19} /><Line {...p} x1={17} y1={7} x2={19} y2={5} /><Line {...p} x1={5} y1={19} x2={7} y2={17} /></>;
      case "moon": return <Path {...p} d="M20 14 A9 9 0 1 1 10 4 A7 7 0 0 0 20 14 Z" />;
      case "filter": return <Path {...p} d="M4 5 H20 L14 12 V19 L10 21 V12 Z" />;
      case "zoom-in": return <><Circle {...p} cx={11} cy={11} r={7} /><Line {...p} x1={16.5} y1={16.5} x2={21} y2={21} /><Line {...p} x1={11} y1={8} x2={11} y2={14} /><Line {...p} x1={8} y1={11} x2={14} y2={11} /></>;
      case "zoom-out": return <><Circle {...p} cx={11} cy={11} r={7} /><Line {...p} x1={16.5} y1={16.5} x2={21} y2={21} /><Line {...p} x1={8} y1={11} x2={14} y2={11} /></>;
      case "briefcase": return <><Rect {...p} x={3} y={8} width={18} height={12} rx={2.5} /><Path {...p} d="M9 8 V6 h6 V8" /><Line {...p} x1={3} y1={13} x2={21} y2={13} /></>;
      case "car": return <><Path {...p} d="M3 15 l2 -5.5 h14 l2 5.5 v3 H3 Z" /><Circle cx={7} cy={18} r={1.6} fill={c} /><Circle cx={17} cy={18} r={1.6} fill={c} /></>;
      case "package": return <><Path {...p} d="M12 3 L21 7.5 V16.5 L12 21 L3 16.5 V7.5 Z" /><Line {...p} x1={3} y1={7.5} x2={12} y2={12} /><Line {...p} x1={21} y1={7.5} x2={12} y2={12} /><Line {...p} x1={12} y1={12} x2={12} y2={21} /></>;
      case "heart": return <Path {...p} d="M12 20 C6 15 3 12 3 8.5 A4 4 0 0 1 12 6 A4 4 0 0 1 21 8.5 C21 12 18 15 12 20 Z" />;
      case "list": return <><Line {...p} x1={8} y1={6} x2={20} y2={6} /><Line {...p} x1={8} y1={12} x2={20} y2={12} /><Line {...p} x1={8} y1={18} x2={20} y2={18} /><Circle cx={4} cy={6} r={1.2} fill={c} /><Circle cx={4} cy={12} r={1.2} fill={c} /><Circle cx={4} cy={18} r={1.2} fill={c} /></>;
      case "mic": return <><Rect {...p} x={9} y={3} width={6} height={11} rx={3} /><Path {...p} d="M6 11 a6 6 0 0 0 12 0" /><Line {...p} x1={12} y1={17} x2={12} y2={21} /><Line {...p} x1={8} y1={21} x2={16} y2={21} /></>;
      case "camera": return <><Rect {...p} x={3} y={7} width={18} height={13} rx={2.5} /><Circle {...p} cx={12} cy={13.5} r={3.2} /><Path {...p} d="M8 7 l1.5 -2.5 h5 L16 7" /></>;
      case "flag": return <><Line {...p} x1={6} y1={3} x2={6} y2={21} /><Path {...p} d="M6 4 h11 l-2 3 l2 3 H6" /></>;
      case "pie": return <><Circle {...p} cx={12} cy={12} r={8.5} /><Path {...p} d="M12 12 L12 3.5 A8.5 8.5 0 0 1 20.5 12 Z" fill={c} /></>;
      case "water": return <Path {...p} d="M12 3.5 C12 3.5 5 11 5 15.5 A7 7 0 0 0 19 15.5 C19 11 12 3.5 12 3.5 Z" />;
      case "dots": return <><Circle cx={5} cy={12} r={1.6} fill={c} /><Circle cx={12} cy={12} r={1.6} fill={c} /><Circle cx={19} cy={12} r={1.6} fill={c} /></>;
      case "shield": return <Path {...p} d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z" />;
      case "download": return <><Path {...p} d="M12 4 V15" /><Polyline {...p} points="7 11 12 16 17 11" /><Line {...p} x1={5} y1={20} x2={19} y2={20} /></>;
      case "flame": return <Path {...p} d="M12 3 C13.5 7 17 8.5 15 13 C14 15.5 12.5 15 12.5 15 C12.5 15 9 16 9 12 C9 10 11 9.5 12 3 Z" />;
      case "map-pin": return <><Path {...p} d="M12 21 C12 21 5 14.5 5 9 A7 7 0 0 1 19 9 C19 14.5 12 21 12 21 Z" /><Circle {...p} cx={12} cy={9} r={2.5} /></>;
      case "play": return <Path {...p} d="M8 5 L19 12 L8 19 Z" fill={c} />;
      case "pause": return <><Rect {...p} x={7} y={5} width={3.5} height={14} rx={1} fill={c} /><Rect {...p} x={13.5} y={5} width={3.5} height={14} rx={1} fill={c} /></>;
      case "star": return <Path {...p} d="M12 3 L14.9 9.2 L21.5 9.9 L16.5 14.3 L18 21 L12 17.4 L6 21 L7.5 14.3 L2.5 9.9 L9.1 9.2 Z" />;
      default: return <Circle {...p} cx={12} cy={12} r={9} />;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
