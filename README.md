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

Hai lệnh `dev:*` ở thư mục gốc tự build `packages/shared` trước khi khởi động. TypeScript được cố định ở `5.9.3` (compiler JavaScript) để không phụ thuộc binary TypeScript 7 cho từng hệ điều hành.

Các script gọi CLI TypeScript/Vite/tsx qua `node` bằng `scripts/run-tool.cjs`, tránh lỗi `tsc: Permission denied` do tệp `.bin` mất quyền thực thi khi chuyển từ Windows sang Termux. Cần sao chép cả thư mục `scripts` khi cập nhật dự án trên điện thoại.

Để truy cập từ thiết bị cùng mạng, dùng địa chỉ IP của máy chạy frontend thay cho `localhost`, ví dụ `http://<IP-máy-chủ>:5173/admin.html`. Thiết bị cần kết nối được đến cổng frontend.

## Chạy trên Android / Termux (Samsung A03)

Chưa kiểm thử trực tiếp trên Samsung A03. Không dùng lại `node_modules` từ Windows hoặc từ một môi trường Linux khác. Bản repository hiện có cả dependency đã được Git theo dõi; `.gitignore` chỉ ngăn thêm tệp mới, không loại các tệp đã được theo dõi. Cần cài lại dependency trên điện thoại.

Đặt mã nguồn trong thư mục riêng của Termux, ví dụ `~/worker-feedback`, thay vì chạy tại `/sdcard`, `/storage/emulated/0` hoặc `~/storage/shared`. Bộ nhớ dùng chung của Android không có đầy đủ quyền thực thi và symbolic link mà npm workspaces cần. Nếu sao chép dự án từ máy tính, bỏ qua mọi thư mục `node_modules` và `dist`; giữ các tệp mã nguồn, `package.json` và `package-lock.json`.

Cài môi trường trong Termux:

```sh
pkg update
pkg upgrade
pkg install nodejs-lts python make clang pkg-config binutils
node -v
npm -v
node -p "process.platform + ' ' + process.arch"
```

Backend khóa `better-sqlite3@11.10.0`, cùng phiên bản trong lockfile của repo tham khảo `20.10` đã chạy được trên Termux. Bản 11 có script cài đặt tự biên dịch native module khi không có binary phù hợp. Dự án yêu cầu Node.js >= 22; Node.js 24.13.0 của máy đang gặp lỗi đáp ứng yêu cầu này. Kiểm tra `process.arch` thực tế; không suy ra ARM 32-bit hay ARM64 chỉ từ tên điện thoại.

Tại thư mục gốc của bản mã nguồn đã cập nhật, ví dụ:

```sh
cd ~/worker-feedback
npm run setup:termux
```

`setup:termux` dùng `npm ci` để thay dependency đã cài bằng các phiên bản trong lockfile, cấu hình compiler/header Node của Termux và giới hạn biên dịch ở một tác vụ. Script bật install hooks để SQLite được biên dịch; nếu npm bỏ sót gói Rollup Android, script cài bổ sung đúng phiên bản. Cuối cùng script kiểm tra SQLite bằng database trong RAM. Script dừng nếu có bước thất bại. Lệnh này thay `node_modules`; không thay dữ liệu khảo sát hay sửa package.json/lockfile. Không sao chép đè `node_modules` từ máy tính sau bước này. Không dùng `--omit=optional`: Vite/Rollup/esbuild cần các gói dành cho đúng nền tảng.

### Kiểm tra SQLite sau khi cài đặt

Lỗi `Cannot find module .../better_sqlite3.node` xảy ra khi native module chưa được biên dịch. Phiên bản 13.0.3 trước đây không có install hook; bản sửa chuyển về 11.10.0 để khôi phục bước biên dịch lúc cài như repo tham khảo. Sau khi cập nhật mã nguồn trên điện thoại:

```sh
git pull origin main
npm run setup:termux
npm run check:sqlite
npm run build
```

Script dùng header Node.js của Termux thay vì tải header cho Linux tiêu chuẩn. Lệnh có thể vẫn cần điều chỉnh theo phiên bản Node/Termux; nếu lỗi, giữ nguyên log để chẩn đoán, đặc biệt phần `gyp ERR!` hoặc lỗi compiler đầu tiên. Nếu trước đó đã dùng bản 13 tạo database, dừng server và sao lưu các tệp SQLite liên quan trước khi đổi phiên bản; không xóa database để sửa lỗi dependency.

Kiểm tra SQLite bằng cơ sở dữ liệu trong RAM, không tác động dữ liệu khảo sát:

```sh
npm run check:sqlite
```

Sau đó mở hai phiên Termux, cùng vào thư mục gốc dự án:

```sh
# Phiên 1
npm run dev:backend
```

```sh
# Phiên 2
npm run dev:frontend
```

Mở trình duyệt trên điện thoại tại `http://127.0.0.1:5173`. Hai lệnh dev chạy liên tục; terminal chưa trở lại dấu nhắc là bình thường khi server đã khởi động. Giữ Termux hoạt động; Android có thể dừng tiến trình nền.

Nếu có lỗi, gửi kết quả các lệnh sau cùng phần lỗi đầu tiên của lệnh không chạy:

```sh
pwd
node -v
npm -v
node -p "process.platform + ' ' + process.arch"
npm ls typescript better-sqlite3 vite rollup esbuild tsx
```

| Thông báo | Hướng kiểm tra |
| --- | --- |
| `Permission denied`, `EPERM`, lỗi `symlink` | Chuyển mã nguồn vào `~/worker-feedback`, cài dependency tại đó. |
| `@typescript/typescript-android-*` | Dùng `package.json` và lockfile đã cập nhật TypeScript 5.9.3, rồi cài lại bằng `npm ci`. |
| `@rollup/rollup-android-*`, lỗi esbuild khác nền tảng | Không dùng dependency Windows; cài lại với `--include=optional`. |
| `better_sqlite3.node`, `ERR_DLOPEN_FAILED` | Biên dịch SQLite tại môi trường đang chạy và kiểm tra bằng database trong RAM ở trên. |
| `Cannot find module '@worker-feedback/shared'` | Cài từ thư mục gốc; chạy `npm run build:shared`. |
| `Killed` / signal 9 | Kiểm tra giới hạn RAM và cơ chế dừng ứng dụng nền của Android; đóng ứng dụng khác, chạy build riêng trước khi mở hai server. |

Nếu native module vẫn không biên dịch được, có thể dùng Linux qua [PRoot Distro của Termux](https://github.com/termux/proot-distro). Cài Node.js >= 22 và dependency bên trong Linux đó; không dùng chung `node_modules` với Termux native. Đây là phương án cần cài thêm môi trường, chưa được kiểm thử cho dự án này trên A03.

Tham khảo: [môi trường thực thi Termux](https://github.com/termux/termux-packages/wiki/Termux-execution-environment), [lưu trữ dùng chung](https://wiki.termux.com/wiki/Internal_and_external_storage), [biên dịch better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/compilation.md).

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
