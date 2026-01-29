"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

// Animated word component with letter-by-letter reveal
const AnimatedWord: React.FC<{ text: string; delayOffset: number }> = ({
  text,
  delayOffset,
}) => {
  return (
    <span className="inline-block whitespace-nowrap">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block transition-colors duration-300 cursor-default text-white will-change-[transform,opacity]"
          style={{
            opacity: 0,
            animationName: "reveal-up-color",
            animationDuration: "1.2s",
            animationIterationCount: "1",
            animationFillMode: "forwards",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            animationDelay: `${delayOffset + i * 50}ms`,
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.animation = "none";
            void target.offsetWidth;
            target.style.animation = "letter-jump 0.8s ease-in-out forwards";
            target.style.opacity = "1";
            target.style.color = "#3b82f6";
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === "letter-jump") {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.color = "white";
            }
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Prevent elastic/bounce overscroll on the home page
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overscrollBehavior = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-[-1]">
        <ShaderGradientCanvas>
          <ShaderGradient
            animate="on"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={2.9}
            cPolarAngle={120}
            cameraZoom={1}
            color1="#b8e7f5"
            color2="#d9ccff"
            color3="#faf9f6"
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
      </div>
      <div className="scanline" />

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid-landing pointer-events-none z-0" />

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center h-[calc(100vh-72px)] px-6 z-10 overflow-hidden">
        {/* Main Content Wrapper */}
        <div className="w-full max-w-5xl flex flex-col items-center text-center gap-8 md:gap-10">
          <h1
            className="text-glow text-5xl md:text-6xl lg:text-[6rem] font-black leading-[1.4] md:leading-[1.1] tracking-tighter text-white uppercase max-w-5xl select-none"
            style={{ fontFamily: "var(--font-satoshi), sans-serif" }}
          >
            <AnimatedWord text="Plan it." delayOffset={100} />
            <br />
            <AnimatedWord text="Launch it." delayOffset={400} />
            <br />
            <AnimatedWord text="Host it." delayOffset={700} />
          </h1>

          <p
            className="animate-reveal max-w-3xl text-base md:text-xl font-bold text-white leading-relaxed px-4 text-glow opacity-0"
            style={{ animationDelay: "1200ms" }}
          >
            From discovering and creating events to selling tickets and handling
            catering, Prismo runs the entire event lifecycle.
          </p>

          <div
            className="animate-reveal pt-6 flex flex-col items-center gap-6 opacity-0"
            style={{ animationDelay: "1400ms" }}
          >
            <Link
              href="/discover"
              className="group relative flex items-center justify-center gap-4 h-16 md:h-20 px-12 md:px-20 rounded-full border-2 border-white bg-white/10 backdrop-blur-md text-white overflow-hidden transition-all duration-500 hover:border-white hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
            >
              <span className="relative z-10 text-lg md:text-xl font-black tracking-[0.2em] transition-colors uppercase">
                Discover Now
              </span>
            </Link>
          </div>
        </div>

        {/* Partners section at bottom */}
        {/* <div
          className="animate-reveal mt-auto md:mt-32 mb-8 w-full max-w-screen-lg border-t border-white/30 pt-10 opacity-0"
          style={{ animationDelay: "1600ms" }}
        >
          <p className="text-center text-[11px] font-mono text-white/70 mb-8 uppercase tracking-[0.5em] font-bold">
            Global Network Partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-80 hover:opacity-100 transition-all duration-700">
            {["VELOCITY", "NEXUS", "ORBITAL", "PULSE", "QUANTUM"].map(
              (partner) => (
                <span
                  key={partner}
                  className="text-sm md:text-2xl font-black text-white tracking-tighter hover:scale-110 transition-all cursor-default text-glow"
                  style={{ fontFamily: "var(--font-satoshi), sans-serif" }}
                >
                  {partner}
                </span>
              )
            )}
          </div>
        </div> */}
      </main>

      {/* Features Section */}
      {/* <FeaturesSection /> */}
    </div>
  );
}

// Separate component for features section with scroll reveal
// function FeaturesSection() {
//   const { ref, isVisible } = useScrollReveal(0.15);

//   return (
//     <section className="relative z-10 w-full py-32 bg-[#050505] border-t border-white/5">
//       <div className="max-w-[1440px] mx-auto px-6">
//         <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {features.map((feature, index) => {
//             const IconComponent = feature.icon;
//             return (
//               <div
//                 key={feature.id}
//                 className={`landing-feature-card group relative p-10 rounded-xl border border-white/10 bg-[#131315] hover:border-purple-500/50 transition-all duration-700 ${
//                   isVisible
//                     ? "opacity-100 translate-y-0 blur-0"
//                     : "opacity-0 translate-y-12 blur-sm"
//                 }`}
//                 style={{
//                   transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
//                 }}
//               >
//                 {/* Animated corner glow */}
//                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-colors" />

//                 <div
//                   className={`w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-500 ${
//                     isVisible ? "scale-100 rotate-0" : "scale-75 -rotate-12"
//                   }`}
//                   style={{
//                     transitionDelay: isVisible ? `${index * 150 + 100}ms` : "0ms",
//                   }}
//                 >
//                   <IconComponent className="w-7 h-7 text-white group-hover:text-purple-500 transition-colors" />
//                 </div>

//                 <h3
//                   className={`text-2xl font-bold text-white mb-4 group-hover:text-purple-500 transition-all duration-500 ${
//                     isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
//                   }`}
//                   style={{
//                     fontFamily: "var(--font-satoshi), sans-serif",
//                     transitionDelay: isVisible ? `${index * 150 + 200}ms` : "0ms",
//                   }}
//                 >
//                   {feature.title}
//                 </h3>
//                 <p
//                   className={`text-base text-gray-400 leading-relaxed transition-all duration-500 ${
//                     isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
//                   }`}
//                   style={{
//                     transitionDelay: isVisible ? `${index * 150 + 300}ms` : "0ms",
//                   }}
//                 >
//                   {feature.description}
//                 </p>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }
