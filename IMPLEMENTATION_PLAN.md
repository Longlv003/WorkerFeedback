# 📋 WORKER FEEDBACK SURVEY — IMPLEMENTATION PLAN (UPDATED)

> **Project**: Khảo sát ý kiến và bức xúc của người lao động  
> **Version**: MVP (Phase 1)  
> **Date**: 01/10/2026  
> **Status**: APPROVED — Bắt đầu triển khai code

---

## 1. Cấu hình xác nhận từ người dùng

- **Mã nhân viên (ID)**: String, bắt buộc nhập, giữ nguyên chữ & số (e.g. `00123`, `NV-01`).
- **Bộ phận (Department)**: `SIM`, `AOM`, `AOI` (Cấu hình sẵn trong `worker-fields.json`).
- **Vị trí làm việc (WorkLocation)**: `Scan`, `CRV`, `Sub Leader`, `Line Leader`, `Carier`, `Support` (Cấu hình sẵn trong `worker-fields.json`).
- **Offline Support / Auto Draft**: Lưu tiến trình làm khảo sát vào `localStorage`, khôi phục nếu lỡ reload trang.
- **Nút "Đóng" (Trang cảm ơn)**: Xóa draft `localStorage` và quay về trang đầu (Trang 1 - Nhập thông tin) để người tiếp theo thực hiện.
- **Chống spam submission**: Client-side disable button + server-side Idempotency Key (UUID).
- **Quy mô**: ~150 submit/đợt, ~450 rows/tháng. Storage bằng Excel (.xlsx) hoàn toàn đáp ứng tốt.
- **QR Code**: Người dùng tự tạo QR hướng đến URL của web app.

---

## 2. Quy trình triển khai Code (Roadmap Execution)

### Bước 1: Khởi tạo Monorepo Workspace & Shared Types
- Khởi tạo `package.json` ở root.
- Tạo gói `packages/shared` chứa interface chung (`SurveyConfig`, `Question`, `WorkerInfo`, `SurveySubmission`, v.v.).

### Bước 2: Triển khai Backend (Express + TypeScript + ExcelJS)
- Cấu hình server Express + Middleware (`cors`, `helmet`, `express-rate-limit`).
- Đọc file cấu hình `survey.json` & `worker-fields.json`.
- Triển khai `GET /api/survey/config` & `GET /api/health`.
- Triển khai `IResponseStorage` với `ExcelStorage` và `WriteQueue` (đảm bảo ghi file Excel an toàn, chống race condition).
- Triển khai `POST /api/survey/submit` kèm Server-side Validation & Idempotency Key.

### Bước 3: Triển khai Frontend (React + Vite + Vanilla CSS)
- Tạo app React SPA với 3 trang chính:
  1. `WorkerInfoPage`: Nhập ID, Họ tên, Chọn Bộ phận, Vị trí, Ẩn danh (UI option) + Validation lỗi đỏ ngay tại ô nhập.
  2. `SurveyPage`: Đọc câu hỏi động từ JSON, hiển thị toàn bộ câu hỏi trên **1 trang duy nhất**, xử lý **Conditional Questions** (Show/Hide + bỏ validate khi ẩn), Validation hiển thị đỏ ở tất cả các câu chưa trả lời. Auto-scroll tới câu lỗi đầu tiên.
  3. `ThankYouPage`: Trang cảm ơn + Nút "Đóng" để reset form quay lại Bước 1.
- Tích hợp `localStorage` để lưu nháp tự động.
- Giao diện **Mobile-First**, nút bấm lớn, chuẩn responsive, màu sắc tương phản cao.

### Bước 4: Kiểm thử và Hoàn thiện (Verification)
- Kiểm thử end-to-end từ nhập liệu -> trả lời -> submit -> kiểm tra file Excel xuất ra.
