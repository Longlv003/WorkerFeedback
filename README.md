# SEI Worker Feedback

Ứng dụng khảo sát ý kiến người lao động, gồm giao diện người tham gia và trang quản trị kết quả. Dữ liệu được lưu trong SQLite; quản trị viên có thể tải kết quả ra Excel.

## Chức năng

### Người tham gia

- Nhập ID nhân viên, họ tên, bộ phận và vị trí làm việc.
- Trả lời câu hỏi khảo sát và câu hỏi phụ xuất hiện theo câu trả lời.
- Kiểm tra các trường bắt buộc trước khi gửi.
- Lưu nháp trên trình duyệt và khôi phục khi tải lại trang.
- Sau khi gửi thành công, hiển thị trang cảm ơn và nút tham gia lại khảo sát.

### Quản trị viên

- Đăng nhập bằng mật khẩu quản trị.
- Sử dụng một trang duy nhất, mở rộng theo toàn bộ chiều ngang màn hình desktop.
- Xem tổng lượt tham gia và thời điểm cập nhật dữ liệu gần nhất.
- Bấm **Tải lại dữ liệu** để lấy dữ liệu mới nhất và giữ các bộ lọc đang chọn.
- Xem số kết quả phù hợp trên tổng số lượt tham gia.
- Bấm **Xuất Excel** để tải tệp `.xlsx` chứa toàn bộ dữ liệu mới nhất từ server.

Ngày gửi mới được lưu theo ISO; giao diện và tệp Excel hiển thị theo giờ Việt Nam. Bộ lọc ngày hỗ trợ cả bản ghi ISO và bản ghi cũ theo định dạng `vi-VN`.

## Công nghệ và cấu trúc

- Frontend: React, TypeScript, Vite; trang admin dùng HTML/CSS/JavaScript.
- Backend: Express, TypeScript, `better-sqlite3`, ExcelJS.
- Monorepo: npm workspaces, kiểu dữ liệu chung trong `packages/shared`.

```text
backend/
  src/
    config/           # Cấu hình câu hỏi, bộ phận và vị trí
    controllers/      # Xử lý khảo sát, quản trị và xuất Excel
    routes/           # Khai báo API
    services/         # Kiểm tra dữ liệu
    storage/          # Lưu trữ SQLite; có mã ExcelStorage cũ
frontend/
  public/
    admin.html        # Trang quản trị
    admin.css         # Giao diện quản trị
    admin.js          # Đăng nhập, tải dữ liệu, lọc và tải Excel
  src/                # Giao diện khảo sát React
packages/shared/      # Các kiểu dữ liệu TypeScript dùng chung
data/
  responses.db        # Cơ sở dữ liệu đang được sử dụng
```

## Cài đặt và chạy phát triển

Môi trường đã kiểm tra: Node.js 22.17.1 và npm. Chạy các lệnh sau tại thư mục gốc dự án:

```powershell
npm install
npm run build:shared
```

Mở hai terminal tại thư mục gốc.

Terminal 1 — backend:

```powershell
npm run dev:backend
```

Terminal 2 — frontend:

```powershell
npm run dev:frontend
```

| Trang            | Địa chỉ mặc định                 |
| ---------------- | -------------------------------- |
| Khảo sát         | http://localhost:5173/           |
| Quản trị         | http://localhost:5173/admin.html |
| Kiểm tra backend | http://localhost:5000/api/health |

Vite chuyển tiếp các yêu cầu `/api` đến backend tại `http://localhost:5000`. Cấu hình nằm trong `frontend/vite.config.ts`.

Để truy cập từ thiết bị cùng mạng, dùng địa chỉ IP của máy chạy frontend thay cho `localhost`, ví dụ `http://<IP-máy-chủ>:5173/admin.html`. Thiết bị cần kết nối được đến cổng frontend.

## Build và chạy bản đã biên dịch

Build toàn bộ dự án theo thứ tự shared → backend → frontend:

```powershell
npm run build
```

Các thư mục đầu ra:

- `packages/shared/dist`: kiểu dữ liệu và mã dùng chung đã biên dịch.
- `backend/dist`: backend cùng các tệp cấu hình.
- `frontend/dist`: giao diện khảo sát và các tệp admin.

Chạy backend đã biên dịch:

```powershell
npm run start --prefix backend
```

Khi triển khai, phục vụ `frontend/dist` bằng web server và chuyển tiếp `/api` đến backend. Backend hiện chỉ phục vụ API, chưa phục vụ trực tiếp frontend. Cấu hình proxy trong Vite chỉ áp dụng cho chế độ phát triển; `vite preview` không thay thế cấu hình proxy khi triển khai.

Backend dùng cổng `5000` mặc định. Có thể đổi bằng biến môi trường `PORT`, ví dụ trong PowerShell:

```powershell
$env:PORT = '5001'
npm run start --prefix backend
```

Nếu đổi cổng backend, cập nhật địa chỉ proxy tương ứng.

## Cấu hình khảo sát

| Tệp                                     | Nội dung                                                            |
| --------------------------------------- | ------------------------------------------------------------------- |
| `backend/src/config/survey.json`        | Tiêu đề, phiên bản, câu hỏi, lựa chọn và điều kiện hiện câu hỏi phụ |
| `backend/src/config/worker-fields.json` | Danh sách bộ phận và vị trí làm việc                                |

Giữ ID câu hỏi ổn định để đối chiếu với các câu trả lời đã lưu. Cập nhật `version` khi thay đổi nội dung khảo sát. Trang admin và tệp xuất Excel vẫn bổ sung cột cho ID câu hỏi cũ có dữ liệu nhưng không còn trong cấu hình hiện tại.

Cấu hình được cache trong bộ nhớ backend. Sau khi thay đổi JSON, khởi động lại backend; nếu dùng bản đã biên dịch, chạy lại `npm run build` để sao chép cấu hình mới vào `backend/dist/config`.

## Lưu trữ dữ liệu

Nguồn dữ liệu hiện tại là `data/responses.db`, gồm bảng `submissions` và `answers`. Backend tự tạo thư mục và bảng nếu chưa tồn tại. Mã `ExcelStorage` và tệp `data/responses.xlsx` có thể còn từ triển khai trước; luồng gửi khảo sát hiện tại ghi vào SQLite, còn nút **Xuất Excel** tạo tệp từ SQLite tại thời điểm yêu cầu.

SQLite dùng chế độ WAL nên có thể xuất hiện `responses.db-wal` và `responses.db-shm`. Khi sao lưu bằng cách sao chép tệp, dừng backend trước và giữ các tệp SQLite liên quan cùng nhau. Tránh thay thế cơ sở dữ liệu đang được backend sử dụng.

Bản nháp khảo sát được lưu trong `localStorage` của trình duyệt với khóa `worker_feedback_draft_v1`. Đây là dữ liệu trên từng trình duyệt, không phải bài nộp đã ghi nhận trên server.

## API

| Phương thức | Đường dẫn                       | Chức năng                                  |
| ----------- | ------------------------------- | ------------------------------------------ |
| GET         | `/api/health`                   | Kiểm tra backend                           |
| GET         | `/api/survey/config`            | Lấy cấu hình khảo sát                      |
| POST        | `/api/survey/submit`            | Kiểm tra và lưu bài khảo sát               |
| POST        | `/api/survey/admin/login`       | Đăng nhập với JSON `{ "password": "..." }` |
| GET         | `/api/survey/admin/submissions` | Lấy toàn bộ bài nộp và câu trả lời         |
| GET         | `/api/survey/admin/stats`       | Lấy thống kê tổng lượt, hôm nay và bộ phận |
| GET         | `/api/survey/admin/export`      | Tải toàn bộ dữ liệu dạng `.xlsx`           |

Các API admin lấy dữ liệu yêu cầu header `Authorization: Bearer <token>` nhận được sau đăng nhập. Giao diện lưu token trong bộ nhớ và xóa khi đăng xuất hoặc tải lại trang.

## Kiểm tra sau thay đổi

```powershell
npm run build
node --check frontend/public/admin.js
```

Kiểm tra trên trình duyệt:

1. Gửi thử khảo sát và kiểm tra thông báo thành công.
2. Đăng nhập admin, bấm **Tải lại dữ liệu** và xác nhận bản ghi mới xuất hiện.
3. Mở admin ở màn hình desktop rộng, kiểm tra bảng sử dụng hết vùng nội dung và cuộn ngang được.
