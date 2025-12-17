"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function StripeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (success) {
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Setup Complete!
          </h1>

          <p className="text-gray-600 mb-6">
            Your Stripe account has been successfully connected. You can now receive payments for your events.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              Redirecting to event creation in <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/event-creation"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
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
      </div>
    );
  }

  // Error or cancelled state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
