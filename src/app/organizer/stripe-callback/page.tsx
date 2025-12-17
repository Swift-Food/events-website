"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight, Sparkles, PartyPopper } from "lucide-react";
import Link from "next/link";

// Confetti piece component
function ConfettiPiece({ delay, left, color }: { delay: number; left: number; color: string }) {
  return (
    <div
      className="absolute w-3 h-3 opacity-0 animate-confetti"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
}

// Confetti container
function Confetti() {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </div>
  );
}

function StripeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (success) {
      setShowConfetti(true);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/event-creation");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [success, router]);

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        {showConfetti && <Confetti />}

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center relative z-10">
          {/* Decorative elements */}
          <div className="absolute -top-3 -left-3">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute -top-3 -right-3">
            <PartyPopper className="w-8 h-8 text-pink-400 animate-bounce" />
          </div>

          {/* Animated checkmark */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-success-pop">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Setup Complete!
          </h1>

          <p className="text-gray-600 mb-6">
            Your Stripe account has been successfully connected. You can now receive payments for your events.
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 text-sm font-medium">
              Redirecting to event creation in <span className="font-bold text-green-600">{countdown}</span> seconds...
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/event-creation"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-md"
            >
              Create an Event
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes confetti {
            0% {
              opacity: 1;
              top: -10%;
              transform: translateX(0) rotate(0deg);
            }
            100% {
              opacity: 0;
              top: 100%;
              transform: translateX(100px) rotate(720deg);
            }
          }
          @keyframes success-pop {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          :global(.animate-confetti) {
            animation: confetti 3s ease-out forwards;
          }
          :global(.animate-success-pop) {
            animation: success-pop 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // Error or cancelled state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Setup Incomplete
        </h1>

        <p className="text-gray-600 mb-6">
          Your Stripe account setup was not completed. You can try again whenever you&apos;re ready.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/event-creation"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function StripeCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StripeCallbackContent />
    </Suspense>
  );
}
