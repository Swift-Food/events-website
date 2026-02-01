"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import type { ShaderPreset } from "@/types/event/theme";

export default function ShaderBackgroundInner({
  preset,
}: {
  preset: ShaderPreset;
}) {
  return (
    <ShaderGradientCanvas>
      <ShaderGradient
        animate="on"
        brightness={1.2}
        cAzimuthAngle={180}
        cDistance={2.9}
        cPolarAngle={120}
        cameraZoom={1}
        color1={preset.color1}
        color2={preset.color2}
        color3={preset.color3}
        envPreset="city"
        grain="off"
        lightType="3d"
        positionX={0}
        positionY={1.8}
        positionZ={0}
        reflection={0.1}
        rotationX={0}
        rotationY={0}
        rotationZ={-90}
        type="waterPlane"
        uAmplitude={0}
        uDensity={1}
        uFrequency={5.5}
        uSpeed={0.1}
        uStrength={3}
        uTime={0.2}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}
