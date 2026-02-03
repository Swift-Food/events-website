"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import type { ShaderPreset } from "@/types/event/theme";
import { DEFAULT_SHADER_SETTINGS } from "@/lib/theme-presets";

export default function ShaderBackgroundInner({
  preset,
}: {
  preset: ShaderPreset;
}) {
  const s = { ...DEFAULT_SHADER_SETTINGS, ...preset.settings };

  return (
    <ShaderGradientCanvas>
      <ShaderGradient
        animate="on"
        brightness={s.brightness}
        cAzimuthAngle={s.cAzimuthAngle}
        cDistance={s.cDistance}
        cPolarAngle={s.cPolarAngle}
        cameraZoom={s.cameraZoom}
        color1={preset.color1}
        color2={preset.color2}
        color3={preset.color3}
        envPreset={s.envPreset}
        grain="off"
        lightType="3d"
        positionX={s.positionX}
        positionY={s.positionY}
        positionZ={s.positionZ}
        reflection={s.reflection}
        rotationX={s.rotationX}
        rotationY={s.rotationY}
        rotationZ={s.rotationZ}
        type={s.type}
        uAmplitude={s.uAmplitude}
        uDensity={s.uDensity}
        uFrequency={s.uFrequency}
        uSpeed={s.uSpeed}
        uStrength={s.uStrength}
        uTime={s.uTime}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}
