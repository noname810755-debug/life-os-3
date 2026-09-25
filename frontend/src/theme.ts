// Design tokens for Life OS. Orange premium palette, light + dark.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F5F6F8", // app canvas
  onSurface: "#1C1C1E",
  surfaceSecondary: "#FFFFFF", // cards
  onSurfaceSecondary: "#1C1C1E",
  surfaceTertiary: "#EFF1F4", // inputs, chips
  onSurfaceTertiary: "#3A3A3C",
  surfaceInverse: "#1C1C1E",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8E8E93",

  brand: "#FF5E00",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF5E00",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF6600",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFE9DC", // soft orange tint
  onBrandTertiary: "#B23F00",

  success: "#1E9E5A",
  onSuccess: "#FFFFFF",
  warning: "#E08A00",
  onWarning: "#FFFFFF",
  error: "#E23B3B",
  onError: "#FFFFFF",
  info: "#2B6BE4",
  onInfo: "#FFFFFF",

  border: "#E6E8EC",
  borderStrong: "#D3D6DC",
  divider: "#ECEEF1",
};

const dark: typeof light = {
  surface: "#0E0F12",
  onSurface: "#F5F6F8",
  surfaceSecondary: "#191B1F",
  onSurfaceSecondary: "#F5F6F8",
  surfaceTertiary: "#23262B",
  onSurfaceTertiary: "#D4D6DB",
  surfaceInverse: "#F5F6F8",
  onSurfaceInverse: "#0E0F12",
  muted: "#8E9098",

  brand: "#FF5E00",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF6A14",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF7A2E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#3A2417",
  onBrandTertiary: "#FFB489",

  success: "#37C07A",
  onSuccess: "#04220F",
  warning: "#F0A83A",
  onWarning: "#2A1B00",
  error: "#FF5C5C",
  onError: "#2A0808",
  info: "#5B93FF",
  onInfo: "#04122A",

  border: "#2A2D33",
  borderStrong: "#3A3E45",
  divider: "#23262B",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(null);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 20, xl: 24, pill: 999 };
