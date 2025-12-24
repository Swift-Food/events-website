"use client";

import { X, Check, Loader2 } from "lucide-react";

interface QuestionFormItem {
  question: string;
  type: "shortText" | "longText" | "singleSelect" | "multiSelect";
  required?: boolean;
  options?: string[];
}

interface RegistrationQuestionsModalProps {
  isOpen: boolean;
  questionForm: QuestionFormItem[];
  questionAnswers: Record<string, any>;
  onQuestionChange: (question: string, value: any) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  zIndex?: number;
}

export default function RegistrationQuestionsModal({
  isOpen,
  questionForm,
  questionAnswers,
  onQuestionChange,
  onCancel,
  onSubmit,
  isSubmitting,
  zIndex = 50,
}: RegistrationQuestionsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{ zIndex }}
    >
      <div className="bg-gradient-to-b from-card-background to-card-secondary-background rounded-3xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Almost there!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please answer a few questions to complete your registration
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6 space-y-5 max-h-[50vh] overflow-y-auto">
          {questionForm.map((q, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                {q.question}
                {q.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>

              {q.type === "shortText" && (
                <input
                  type="text"
                  value={questionAnswers[q.question] || ""}
                  onChange={(e) => onQuestionChange(q.question, e.target.value)}
                  placeholder="Your answer..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              )}

              {q.type === "longText" && (
                <textarea
                  value={questionAnswers[q.question] || ""}
                  onChange={(e) => onQuestionChange(q.question, e.target.value)}
                  rows={4}
                  placeholder="Your answer..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                />
              )}

              {q.type === "singleSelect" && q.options && (
                <div className="space-y-2">
                  {q.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      onClick={() => onQuestionChange(q.question, option)}
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
                  {q.options.map((option, optIndex) => {
                    const isChecked = (
                      questionAnswers[q.question] || []
                    ).includes(option);
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
                            onQuestionChange(q.question, updated);
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

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-white/10 bg-card-secondary-background/50">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-sm sm:text-md text-foreground font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl bg-primary text-white text-sm sm:text-md font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
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
  );
}
