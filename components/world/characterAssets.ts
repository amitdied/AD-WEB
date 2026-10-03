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
  hasBeard?: boolean;
  hasShortHair?: boolean;
  hasJacket?: boolean;
  hasBag?: boolean;
  hasGamingSet?: boolean;
  heightScale?: number;
  rootRotationY?: number; // Model root orientation adjustment angle in radians
}

export const CHARACTER_ASSET_REGISTRY: Record<string, CharacterAssetDefinition> = {
  PLAYER_AMITDIED: {
    id: "PLAYER_AMITDIED",
    name: "AMITDIED",
    modelUrl: "/models/characters/player_amitdied.glb",
    colorShirt: "#09090b",
    colorPants: "#0f172a",
    colorShoes: "#dc2626",
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
    colorShirt: "#d97706",
    colorPants: "#27272a",
    colorShoes: "#f8fafc",
    colorSkin: "#334155",
    shirtGraphicColor: "#fef08a",
    hasCap: true,
    hasBag: true,
    heightScale: 1.02,
    rootRotationY: 0,
  },
  FRIEND_CHIKU: {
    id: "FRIEND_CHIKU",
    name: "CHIKU",
    modelUrl: "/models/characters/chiku.glb",
    colorShirt: "#0f766e",
    colorPants: "#1e1b4b",
    colorShoes: "#38bdf8",
    colorSkin: "#334155",
    shirtGraphicColor: "#2dd4bf",
    hasHeadphones: true,
    hasGamingSet: true,
    heightScale: 0.98,
    rootRotationY: 0,
  },
  FRIEND_ADDY: {
    id: "FRIEND_ADDY",
    name: "ADDY",
    modelUrl: "/models/characters/addy.glb",
    colorShirt: "#18181b",
    colorPants: "#09090b",
    colorShoes: "#0891b2",
    colorSkin: "#334155",
    shirtGraphicColor: "#a855f7",
    hasJacket: true,
    hasBeard: true,
    hasShortHair: true,
    heightScale: 1.05,
    rootRotationY: 0,
  },
};

export function getCharacterAssetDef(id: string): CharacterAssetDefinition | undefined {
  return CHARACTER_ASSET_REGISTRY[id];
}
