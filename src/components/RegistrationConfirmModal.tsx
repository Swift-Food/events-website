"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Video,
  Loader2,
  Check,
} from "lucide-react";
import { EventResponseDto } from "@/types/event";
import { EventTicketResponseDto, QuestionBlock } from "@/types/event-ticket/response/ticket.dto";
import { isVirtualEvent, isHybridEvent } from "@/types/event/status";

interface RegistrationConfirmModalProps {
  isOpen: boolean;
  event: EventResponseDto;
  ticket: EventTicketResponseDto;
  isRegistering: boolean;
  onClose: () => void;
  onConfirm: (questionAnswers: Record<string, any>) => void;
}

export default function RegistrationConfirmModal({
  isOpen,
  event,
  ticket,
  isRegistering,
  onClose,
  onConfirm,
}: RegistrationConfirmModalProps) {
  const [acceptedTicketTerms, setAcceptedTicketTerms] = useState(false);
  const [step, setStep] = useState<'summary' | 'questions'>('summary');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});

  const hasQuestions = ticket?.questionForm && ticket.questionForm.length > 0;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isSameDay = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handleQuestionChange = (question: string, value: any) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleConfirm = () => {
    if (!acceptedTicketTerms) return;

    // If there are questions and we're on summary, go to questions
    if (hasQuestions && step === 'summary') {
      setStep('questions');
      return;
    }

    // Otherwise, submit the registration
    onConfirm(questionAnswers);
  };

  const handleClose = () => {
    setAcceptedTicketTerms(false);
    setStep('summary');
    setQuestionAnswers({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-card-background shadow-2xl overflow-hidden">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: step === 'questions' ? 'translateX(-50%)' : 'translateX(0)', width: '200%' }}
          >
            {/* Summary Panel */}
            <div className="w-1/2 p-5 shrink-0">
              {/* Event Image */}
              <div className="relative aspect-square w-36 mx-auto mb-4 rounded-xl overflow-hidden bg-card-secondary-background">
                {event.eventImage ? (
                  <Image
                    src={event.eventImage}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center"
                    style={{ backgroundColor: event.eventColor || "#3b82f6" }}
                  >
                    <Calendar className="h-8 w-8 text-white/30" />
                  </div>
                )}
              </div>

              {/* Event Name */}
              <h3 className="text-xl font-bold text-foreground mb-4 text-center">
                {event.name}
              </h3>

              {/* Date & Time */}
              <div className="flex gap-3 mb-3">
                {isSameDay(event.startDateTime, event.endDateTime) ? (
                  <>
                    <div className="flex flex-col items-center py-1">
                      <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(event.startDateTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center py-1">
                      <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                      <div className="my-1 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                      <div className="h-3 w-3 rounded-full bg-primary/30 shadow-md"></div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Start
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(event.startDateTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(event.startDateTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          End
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(event.endDateTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(event.endDateTime)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 mb-4">
                {isVirtualEvent(event.format) ? (
                  <>
                    <Video className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Online Event</p>
                      <p className="text-sm text-muted-foreground">Virtual meeting link will be provided</p>
                    </div>
                  </>
                ) : isHybridEvent(event.format) ? (
                  <>
                    <Video className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Hybrid Event</p>
                      {event.address ? (
                        <p className="text-sm text-muted-foreground">
                          {event.address.isObscured
                            ? `${event.address.city}, ${event.address.zipcode}`
                            : [event.address.name, event.address.city].filter(Boolean).join(", ")}
                          {" + Online"}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">In-person + Online</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      {event.address ? (
                        event.address.isObscured ? (
                          <>
                            <p className="text-sm font-medium text-foreground">
                              {event.address.city}, {event.address.zipcode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Full address revealed after registration
                            </p>
                          </>
                        ) : (
                          <>
                            {event.address.name && (
                              <p className="text-sm font-medium text-foreground">
                                {event.address.name}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {[event.address.addressLine1, event.address.city, event.address.zipcode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">Location TBD</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Selected Ticket */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ticket.name}</p>
                    <p className="text-xs text-muted-foreground">Selected ticket</p>
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {Number(ticket.price) === 0 ? "Free" : `£${Number(ticket.price).toFixed(2)}`}
                  </p>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTicketTerms}
                    onChange={(e) => setAcceptedTicketTerms(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-white/20 bg-card-secondary-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <a
                      href="/terms/ticket"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ticket Sales Terms and Conditions
                    </a>
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!acceptedTicketTerms || isRegistering}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : hasQuestions ? (
                    "Continue"
                  ) : (
                    "Confirm Registration"
                  )}
                </button>
              </div>
            </div>

            {/* Questions Panel */}
            <div className="w-1/2 shrink-0 flex flex-col max-h-[80vh]">
              {/* Header with back button */}
              <div className="p-5 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('summary')}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Almost there!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Please answer a few questions to complete your registration
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions Form */}
              {ticket?.questionForm && (
                <div className="flex-1 overflow-y-auto px-5 space-y-4">
                  {ticket.questionForm.map((q: QuestionBlock, index: number) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {q.question}
                        {q.required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>

                      {q.type === "shortText" && (
                        <input
                          type="text"
                          value={questionAnswers[q.question] || ""}
                          onChange={(e) => handleQuestionChange(q.question, e.target.value)}
                          placeholder="Your answer..."
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      )}

                      {q.type === "longText" && (
                        <textarea
                          value={questionAnswers[q.question] || ""}
                          onChange={(e) => handleQuestionChange(q.question, e.target.value)}
                          rows={4}
                          placeholder="Your answer..."
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                        />
                      )}

                      {q.type === "singleSelect" && q.options && (
                        <div className="space-y-2">
                          {q.options.map((option: string, optIndex: number) => (
                            <label
                              key={optIndex}
                              onClick={() => handleQuestionChange(q.question, option)}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                questionAnswers[q.question] === option
                                  ? "border-primary bg-primary/10"
                                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  questionAnswers[q.question] === option
                                    ? "border-primary"
                                    : "border-white/30"
                                }`}
                              >
                                {questionAnswers[q.question] === option && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="text-foreground">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === "multiSelect" && q.options && (
                        <div className="space-y-2">
                          {q.options.map((option: string, optIndex: number) => {
                            const isChecked = (questionAnswers[q.question] || []).includes(option);
                            return (
                              <label
                                key={optIndex}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isChecked
                                      ? "border-primary bg-primary"
                                      : "border-white/30"
                                  }`}
                                >
                                  {isChecked && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <span className="text-foreground">{option}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = questionAnswers[q.question] || [];
                                    const updated = e.target.checked
                                      ? [...current, option]
                                      : current.filter((o: string) => o !== option);
                                    handleQuestionChange(q.question, updated);
                                  }}
                                  className="sr-only"
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="p-5 pt-4 border-t border-white/10 mt-auto">
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('summary')}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => onConfirm(questionAnswers)}
                    disabled={isRegistering}
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
