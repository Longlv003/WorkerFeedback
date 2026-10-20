import React from 'react';
import { Question } from '@worker-feedback/shared';
import { evaluateCondition } from '../utils/conditionalEvaluator';

interface Props {
  question: Question;
  answers: Record<string, string | string[]>;
  errors: Record<string, string>;
  onAnswerChange: (questionId: string, value: string | string[]) => void;
}

const getQuestionNumber = (id: string): string => {
  const match = id.match(/^Q(\d+)$/);
  return match ? match[1] : '';
};

export const QuestionRenderer: React.FC<Props> = ({ question, answers, errors, onAnswerChange }) => {
  const currentValue = answers[question.id];
  const errorMessage = errors[question.id];

  const handleSingleChoice   = (val: string) => onAnswerChange(question.id, val);
  const handleMultipleChoice = (val: string) => {
    const list = Array.isArray(currentValue) ? [...currentValue] : [];
    const idx  = list.indexOf(val);
    if (idx > -1) list.splice(idx, 1); else list.push(val);
    onAnswerChange(question.id, list);
  };
  const handleTextarea = (text: string) => onAnswerChange(question.id, text);

  const questionNum  = getQuestionNumber(question.id);
  const isTopLevel   = questionNum !== '';

  return (
    <div
      id={`question-card-${question.id}`}
      className={`question-card ${errorMessage ? 'has-error' : ''}`}
    >
      <div className="question-label-row">
        {isTopLevel && (
          <div className="question-number-badge">{questionNum}</div>
        )}
        <div style={{ flex: 1 }}>
          <div className="question-text">
            {question.text}
            {question.required && <span className="required-asterisk">*</span>}
          </div>
        </div>
      </div>

      {question.type === 'textarea' && (
        <div className="question-hint">
          <img src="/icons/edit.svg" alt="" width="12" height="12" />
          Nhập ý kiến của bạn bên dưới (bắt buộc nếu chọn Có)
        </div>
      )}

      {question.type === 'single_choice' && question.options && (
        <div className="options-list">
          {question.options.map((opt) => (
            <label key={opt.value} className={`option-item ${currentValue === opt.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`question_${question.id}`}
                checked={currentValue === opt.value}
                onChange={() => handleSingleChoice(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <div className="options-list">
          {question.options.map((opt) => {
            const isChecked = Array.isArray(currentValue) && currentValue.includes(opt.value);
            return (
              <label key={opt.value} className={`option-item ${isChecked ? 'selected' : ''}`}>
                <input type="checkbox" checked={isChecked} onChange={() => handleMultipleChoice(opt.value)} />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'textarea' && (
        <textarea
          className={`form-control ${errorMessage ? 'has-error' : ''}`}
          rows={4}
          placeholder="Nhập câu trả lời của bạn tại đây..."
          value={(currentValue as string) || ''}
          onChange={(e) => handleTextarea(e.target.value)}
        />
      )}

      {errorMessage && (
        <div className="error-text" style={{ marginTop: '8px' }}>
          <img src="/icons/alert.svg" alt="" width="14" height="14" />
          {errorMessage}
        </div>
      )}

      {question.conditionalQuestions && question.conditionalQuestions.length > 0 && (
        <>
          {question.conditionalQuestions.map((rule, idx) => {
            if (!evaluateCondition(rule.showWhen, currentValue)) return null;
            return (
              <div key={idx} className="conditional-container">
                <QuestionRenderer question={rule.question} answers={answers} errors={errors} onAnswerChange={onAnswerChange} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
