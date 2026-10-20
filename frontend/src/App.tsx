import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  APIConfigResponse,
  WorkerInfo,
  SurveySubmission,
  SurveyAnswer
} from '@worker-feedback/shared';
import { fetchSurveyConfig, submitSurveyData } from './api/surveyApi';
import { WorkerInfoForm } from './components/WorkerInfoForm';
import { SurveyForm } from './components/SurveyForm';
import { ThankYouPage } from './components/ThankYouPage';

const DRAFT_KEY = 'worker_feedback_draft_v1';

interface DraftData {
  step: 'worker_info' | 'survey' | 'thank_you';
  workerInfo: WorkerInfo | null;
  answers: Record<string, string | string[]>;
  idempotencyKey: string;
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<APIConfigResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Flow step state: 1 (worker_info) -> 2 (survey) -> 3 (thank_you)
  const [step, setStep] = useState<'worker_info' | 'survey' | 'thank_you'>('worker_info');
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => uuidv4());

  // Load config & restore draft on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchSurveyConfig();
        setConfig(data);

        // Restore draft if exists
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const parsed: DraftData = JSON.parse(savedDraft);
            if (parsed.step && parsed.step !== 'thank_you') {
              setStep(parsed.step);
              setWorkerInfo(parsed.workerInfo);
              setAnswers(parsed.answers || {});
              if (parsed.idempotencyKey) {
                setIdempotencyKey(parsed.idempotencyKey);
              }
            }
          } catch (e) {
            console.error('Lỗi parse draft:', e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Không thể kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Auto save draft on change
  useEffect(() => {
    if (step !== 'thank_you') {
      const draft: DraftData = {
        step,
        workerInfo,
        answers,
        idempotencyKey
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [step, workerInfo, answers, idempotencyKey]);

  const handleWorkerInfoContinue = (info: WorkerInfo) => {
    setWorkerInfo(info);
    setStep('survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSurveySubmit = async (surveyAnswers: Record<string, string | string[]>) => {
    if (!config || !workerInfo) return;

    setAnswers(surveyAnswers);

    const formattedAnswers: SurveyAnswer[] = Object.entries(surveyAnswers).map(
      ([questionId, value]) => ({
        questionId,
        value
      })
    );

    const freshKey = uuidv4();
    const submissionPayload: SurveySubmission = {
      idempotencyKey: freshKey,
      surveyId: config.survey.surveyId,
      surveyVersion: config.survey.version,
      worker: { ...workerInfo, anonymous: false },
      answers: formattedAnswers
    };

    await submitSurveyData(submissionPayload);

    // Submission succeeded -> clear draft & move to thank you page
    localStorage.removeItem(DRAFT_KEY);
    setStep('thank_you');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setWorkerInfo(null);
    setAnswers({});
    setIdempotencyKey(uuidv4());
    setStep('worker_info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="big-spinner"></div>
        <p>Đang tải khảo sát...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="app-container" style={{ paddingTop: '40px' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)', borderWidth: '2px' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '12px', fontSize: '18px' }}>Không thể kết nối</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {step === 'worker_info' && (
        <WorkerInfoForm
          fieldsConfig={config.workerFields}
          initialData={workerInfo}
          onContinue={handleWorkerInfoContinue}
        />
      )}

      {step === 'survey' && (
        <SurveyForm
          surveyConfig={config.survey}
          initialAnswers={answers}
          onSubmit={handleSurveySubmit}
        />
      )}

      {step === 'thank_you' && (
        <ThankYouPage onClose={handleResetForm} />
      )}
    </div>
  );
};

export default App;
