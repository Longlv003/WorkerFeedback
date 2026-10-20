import { Question, SurveyConfig } from "@worker-feedback/shared";
import React, { useState } from "react";
import { evaluateCondition } from "../utils/conditionalEvaluator";
import { QuestionRenderer } from "./QuestionRenderer";

interface Props {
  surveyConfig: SurveyConfig;
  initialAnswers: Record<string, string | string[]>;
  onSubmit: (answers: Record<string, string | string[]>) => Promise<void>;
}

export const SurveyForm: React.FC<Props> = ({
  surveyConfig,
  initialAnswers,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    initialAnswers || {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalQuestions = surveyConfig.questions.length;
  const answeredCount = surveyConfig.questions.filter((q) => {
    const v = answers[q.id];
    if (!v) return false;
    return typeof v === "string" ? v.trim() !== "" : (v as string[]).length > 0;
  }).length;
  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId])
      setErrors((prev) => {
        const c = { ...prev };
        delete c[questionId];
        return c;
      });
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    let firstErrorId: string | null = null;

    const checkQuestion = (q: Question) => {
      const val = answers[q.id];
      if (q.required) {
        const isMissing =
          !val ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0);
        if (isMissing) {
          newErrors[q.id] = "Vui lòng trả lời câu hỏi này.";
          if (!firstErrorId) firstErrorId = q.id;
        }
      }
      if (q.conditionalQuestions) {
        for (const rule of q.conditionalQuestions) {
          if (evaluateCondition(rule.showWhen, val))
            checkQuestion(rule.question);
        }
      }
    };

    for (const q of surveyConfig.questions) checkQuestion(q);
    return {
      isValid: Object.keys(newErrors).length === 0,
      newErrors,
      firstErrorId,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    const { isValid, newErrors, firstErrorId } = validateAll();
    if (!isValid) {
      setErrors(newErrors);
      if (firstErrorId) {
        const el = document.getElementById(`question-card-${firstErrorId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (err: any) {
      setSubmitError(err.message || "Có lỗi xảy ra khi nộp khảo sát.");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="app-header-banner">
        <div className="banner-label">Nội dung khảo sát</div>
        <h1>{surveyConfig.title}</h1>
        {surveyConfig.description && (
          <p style={{ marginTop: "6px" }}>{surveyConfig.description}</p>
        )}
        <div className="progress-wrap">
          <div
            className="progress-bar"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {answeredCount}/{totalQuestions} câu đã trả lời
        </div>
      </div>

      <div className="step-dots">
        <div className="step-dot done"></div>
        <div className="step-dot active"></div>
        <div className="step-dot"></div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "8px", padding: "0 4px" }}>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: "1.5",
            }}
          >
            Vui lòng trả lời trung thực.
          </p>
        </div>

        {surveyConfig.questions.map((q) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            answers={answers}
            errors={errors}
            onAnswerChange={handleAnswerChange}
          />
        ))}

        {submitError && (
          <div
            className="card"
            style={{
              background: "var(--error-light)",
              borderColor: "var(--error)",
              borderWidth: "2px",
            }}
          >
            <div className="error-text" style={{ fontSize: "14px" }}>
              <img src="/icons/alert.svg" alt="" width="16" height="16" />
              {submitError}
            </div>
          </div>
        )}

        <div className="submit-area">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ fontSize: "17px" }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Đang gửi...
              </>
            ) : (
              "Nộp Khảo Sát"
            )}
          </button>
          <div className="submit-note">
            <img src="/icons/shield.svg" alt="" width="13" height="13" />
            Thông tin của bạn được bảo mật hoàn toàn
          </div>
        </div>
      </form>
    </div>
  );
};
