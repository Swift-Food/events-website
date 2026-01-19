"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Eye, BarChart3 } from "lucide-react";

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
          className="inline-block transition-all cursor-default text-white"
          style={{
            opacity: 0,
            animationName: "reveal-up, letter-jump",
            animationDuration: "1s, 0.8s",
            animationIterationCount: "1, 1",
            animationFillMode: "forwards, none",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1), ease-in-out",
            animationDelay: `${delayOffset + i * 60}ms, ${1000 + delayOffset + i * 60}ms`,
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.animation = "none";
            void target.offsetWidth;
            target.style.animation = "letter-jump 0.8s ease-in-out forwards";
            target.style.opacity = "1";
            target.style.color = "#cc4004";
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

// Feature data
const features = [
  {
    id: "1",
    title: "Seamless Ticketing",
    description:
      "Instant issuance and verification protocols for physical and digital entry points. Zero latency.",
    icon: Ticket,
  },
  {
    id: "2",
    title: "Immersive Spaces",
    description:
      "Architectural tools to build atmospheric digital twin environments for your attendees.",
    icon: Eye,
  },
  {
    id: "3",
    title: "Community Analytics",
    description:
      "Deep learning insights into audience engagement, retention, and growth vectors.",
    icon: BarChart3,
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="shader-gradient" />
      <div className="noise-overlay" />
      <div className="scanline" />

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid-landing pointer-events-none z-0" />

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-start md:justify-center flex-grow py-12 md:py-0 px-6 z-10 overflow-hidden min-h-[calc(100vh-80px)]">
        {/* Main Content Wrapper */}
        <div className="w-full max-w-5xl flex flex-col items-center text-center gap-8 md:gap-14 mt-8 md:mt-12 md:translate-y-6">
          <h1
            className="text-glow text-4xl md:text-6xl lg:text-[6rem] font-black leading-[1.6] md:leading-[1.1] tracking-tighter text-white uppercase max-w-5xl select-none"
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
      <section className="relative z-10 w-full py-32 bg-[#050505] border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="animate-reveal landing-feature-card group relative p-10 rounded-xl border border-white/10 bg-[#131315] hover:border-purple-500/50 transition-all duration-500"
                  style={{ animationDelay: `${(index + 3) * 150}ms` }}
                >
                  {/* Animated corner glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-colors" />

                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-500">
                    <IconComponent className="w-7 h-7 text-white group-hover:text-purple-500 transition-colors" />
                  </div>

                  <h3
                    className="text-2xl font-bold text-white mb-4 group-hover:text-purple-500 transition-colors"
                    style={{ fontFamily: "var(--font-satoshi), sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
