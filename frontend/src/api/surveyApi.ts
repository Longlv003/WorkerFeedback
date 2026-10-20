import { APIConfigResponse, APISubmitResponse, SurveySubmission } from '@worker-feedback/shared';

export async function fetchSurveyConfig(): Promise<APIConfigResponse> {
  const response = await fetch('/api/survey/config');
  if (!response.ok) {
    throw new Error('Không thể tải cấu hình khảo sát từ máy chủ.');
  }
  return response.json();
}

export async function submitSurveyData(submission: SurveySubmission): Promise<APISubmitResponse> {
  const response = await fetch('/api/survey/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(submission)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData && errorData.message) {
      throw new Error(errorData.message);
    }
    throw new Error('Có lỗi xảy ra khi nộp khảo sát. Vui lòng thử lại.');
  }

  return response.json();
}
