"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight, Sparkles, PartyPopper, CloudRain, RefreshCw } from "lucide-react";
import Link from "next/link";
import { paymentService } from "@/services/payment.service";

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

// Floating sad clouds for error state
function SadClouds() {
 return (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
   <div className="absolute top-10 left-10 animate-float-slow opacity-20">
    <CloudRain className="w-16 h-16 text-gray-400" />
   </div>
   <div className="absolute top-20 right-16 animate-float-medium opacity-15">
    <CloudRain className="w-12 h-12 text-gray-400" />
   </div>
   <div className="absolute bottom-20 left-20 animate-float-fast opacity-10">
    <CloudRain className="w-10 h-10 text-gray-400" />
   </div>
  </div>
 );
}

function StripeCallbackContent() {
 const router = useRouter();
 const [success, setSuccess] = useState<boolean | null>(null);
 const [countdown, setCountdown] = useState(10);
 const [showConfetti, setShowConfetti] = useState(false);

 // Verify actual status with Stripe instead of trusting URL params
 useEffect(() => {
  paymentService.getStripeConnectStatus()
   .then((status) => setSuccess(status.onboardingComplete))
   .catch(() => setSuccess(false));
 }, []);

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

 if (success === null) {
  return <LoadingState />;
 }

 if (success) {
  return (
   <div className="min-h-screen flex items-center justify-center p-4 relative">
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
  <div className="min-h-screen flex items-center justify-center p-4 relative">
   <SadClouds />

   <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center relative z-10">
    {/* Decorative elements */}
    <div className="absolute -top-3 -left-3">
     <RefreshCw className="w-7 h-7 text-orange-400 animate-spin-slow" />
    </div>
    <div className="absolute -top-3 -right-3 text-2xl animate-wiggle">
     😅
    </div>

    {/* Animated X icon */}
    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-error-shake">
     <XCircle className="w-14 h-14 text-white" />
    </div>

    <h1 className="text-2xl font-bold text-gray-900 mb-2">
     Setup Incomplete
    </h1>

    <p className="text-gray-600 mb-6">
     Looks like you didn&apos;t finish setting up your Stripe account. No worries - you can try again whenever you&apos;re ready!
    </p>

    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6">
     <p className="text-orange-700 text-sm font-medium">
      💡 Tip: Make sure to complete all steps in the Stripe form
     </p>
    </div>

    <div className="flex flex-col gap-3">
     <Link
      href="/event-creation"
      className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-md"
     >
      <RefreshCw className="w-4 h-4" />
      Try Again
     </Link>

     <Link
      href="/"
      className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
     >
      Go Home
     </Link>
    </div>
   </div>

   {/* CSS for error animations */}
   <style jsx>{`
    @keyframes error-shake {
     0%, 100% { transform: translateX(0); }
     10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
     20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    @keyframes wiggle {
     0%, 100% { transform: rotate(0deg); }
     25% { transform: rotate(-10deg); }
     75% { transform: rotate(10deg); }
    }
    @keyframes float-slow {
     0%, 100% { transform: translateY(0) translateX(0); }
     50% { transform: translateY(-20px) translateX(10px); }
    }
    @keyframes float-medium {
     0%, 100% { transform: translateY(0) translateX(0); }
     50% { transform: translateY(-15px) translateX(-8px); }
    }
    @keyframes float-fast {
     0%, 100% { transform: translateY(0) translateX(0); }
     50% { transform: translateY(-10px) translateX(5px); }
    }
    @keyframes spin-slow {
     from { transform: rotate(0deg); }
     to { transform: rotate(360deg); }
    }
    :global(.animate-error-shake) {
     animation: error-shake 0.6s ease-out;
    }
    :global(.animate-wiggle) {
     animation: wiggle 1s ease-in-out infinite;
    }
    :global(.animate-float-slow) {
     animation: float-slow 6s ease-in-out infinite;
    }
    :global(.animate-float-medium) {
     animation: float-medium 4s ease-in-out infinite;
    }
    :global(.animate-float-fast) {
     animation: float-fast 3s ease-in-out infinite;
    }
    :global(.animate-spin-slow) {
     animation: spin-slow 3s linear infinite;
    }
   `}</style>
  </div>
 );
}

function LoadingState() {
 return (
  <div className="min-h-screen flex items-center justify-center p-4">
   <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
    <p className="text-gray-600">Verifying your Stripe setup...</p>
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
