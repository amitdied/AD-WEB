/**
 * AMITDIED WORLD — Realistic Humanoid Character Asset Registry & Pipeline
 * Provides GLTF/GLB asset URLs, fallback configurations, per-model root orientation,
 * and character definitions for Player, Sahil, Chiku, Addy, and Generic City NPCs.
 */

export interface CharacterAssetDefinition {
  id: string;
  name: string;
  modelUrl?: string; // Optional GLB model URL path
  colorShirt: string;
  colorPants: string;
  colorShoes: string;
  colorSkin: string;
  shirtGraphicColor?: string;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  hasBeanie?: boolean;
  heightScale?: number;
  rootRotationY?: number; // Model root orientation adjustment angle in radians
}

export const CHARACTER_ASSET_REGISTRY: Record<string, CharacterAssetDefinition> = {
  PLAYER_AMITDIED: {
    id: "PLAYER_AMITDIED",
    name: "AMITDIED",
    modelUrl: "/models/characters/player_amitdied.glb",
    colorShirt: "#0b0f19",
    colorPants: "#0f172a",
    colorShoes: "#ef4444",
    colorSkin: "#334155",
    shirtGraphicColor: "#ef4444",
    hasHeadphones: true,
    hasBeanie: true,
    heightScale: 1.0,
    rootRotationY: 0,
  },
  FRIEND_SAHIL: {
    id: "FRIEND_SAHIL",
    name: "SAHIL",
    modelUrl: "/models/characters/sahil.glb",
    colorShirt: "#09090b",
    colorPants: "#18181b",
    colorShoes: "#f8fafc",
    colorSkin: "#334155",
    shirtGraphicColor: "#f59e0b",
    hasCap: true,
    heightScale: 1.02,
    rootRotationY: 0,
  },
  FRIEND_CHIKU: {
    id: "FRIEND_CHIKU",
    name: "CHIKU",
    modelUrl: "/models/characters/chiku.glb",
    colorShirt: "#0d9488",
    colorPants: "#1e1b4b",
    colorShoes: "#cbd5e1",
    colorSkin: "#334155",
    shirtGraphicColor: "#5eead4",
    heightScale: 0.98,
    rootRotationY: 0,
  },
  FRIEND_ADDY: {
    id: "FRIEND_ADDY",
    name: "ADDY",
    modelUrl: "/models/characters/addy.glb",
    colorShirt: "#4c1d95",
    colorPants: "#09090b",
    colorShoes: "#06b6d4",
    colorSkin: "#334155",
    shirtGraphicColor: "#c084fc",
    hasHeadphones: true,
    heightScale: 1.01,
    rootRotationY: 0,
  },
};

export function getCharacterAssetDef(id: string): CharacterAssetDefinition | undefined {
  return CHARACTER_ASSET_REGISTRY[id];
}
