"use client";

import { HumanoidCharacter, HumanoidActivityState } from "./HumanoidCharacter";

export type { HumanoidActivityState as NPCActivityState };

export interface NPCCharacterProps {
  modelUrl?: string;
  colorShirt?: string;
  colorPants?: string;
  colorShoes?: string;
  colorSkin?: string;
  shirtGraphicColor?: string;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  hasBeanie?: boolean;
  isFriend?: boolean;
  name?: string;
  activityState?: HumanoidActivityState;
  heightScale?: number;
}

/**
 * 3D Humanoid Streetwear Character
 */
export function NPCCharacter(props: NPCCharacterProps) {
  return <HumanoidCharacter {...props} />;
}

export default NPCCharacter;
