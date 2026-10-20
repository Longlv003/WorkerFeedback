import React from 'react';

interface Props {
  onClose: () => void;
}

export const ThankYouPage: React.FC<Props> = ({ onClose }) => {
  return (
    <div>
      <div className="app-header-banner" style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)' }}>
        <div className="banner-label">Hoàn thành</div>
        <h1>Cảm ơn bạn đã<br />đóng góp ý kiến!</h1>
      </div>

      <div className="step-dots">
        <div className="step-dot done"></div>
        <div className="step-dot done"></div>
        <div className="step-dot done active"></div>
      </div>

      <div className="card">
        <div className="thank-you-wrapper">
          <div className="thank-you-icon">
            <img src="/icons/success.svg" alt="Hoàn thành" width="48" height="48"
              style={{ filter: 'invert(29%) sepia(93%) saturate(409%) hue-rotate(107deg) brightness(96%) contrast(97%)' }} />
          </div>

          <div className="thank-you-title">Đã ghi nhận ý kiến của bạn!</div>

          <p className="thank-you-text">
            Cảm ơn bạn đã dành thời gian tham gia khảo sát.<br /><br />
            Những ý kiến đóng góp của bạn sẽ giúp Ban quản lý hiểu rõ hơn về những vấn đề người lao động đang gặp phải và cải thiện môi trường làm việc ngày một tốt hơn.
          </p>

          <div style={{
            background: 'var(--success-light)',
            border: '2px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--success)',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <img src="/icons/shield.svg" alt="" width="16" height="16" style={{ marginTop: '1px', flexShrink: 0,
              filter: 'invert(29%) sepia(93%) saturate(409%) hue-rotate(107deg) brightness(96%) contrast(97%)' }} />
            <span><strong>Cam kết bảo mật:</strong> Thông tin của bạn được lưu trữ an toàn và chỉ được sử dụng cho mục đích cải thiện môi trường làm việc.</span>
          </div>

          <button type="button" className="btn-primary" onClick={onClose}>
            Tham gia lại khảo sát
          </button>
        </div>
      </div>
    </div>
  );
};
