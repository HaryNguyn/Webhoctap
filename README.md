# StudyHub - Website thảo luận và chia sẻ tài nguyên học tập

Sản phẩm cuối kỳ, viết bằng **HTML, CSS và JavaScript thuần**: không dùng thư viện, không cần server.

## 1. Cách chạy

1. Mở thư mục dự án.
2. Nhấp đúp vào `index.html` (dùng Chrome hoặc Edge).
3. Dùng tài khoản có sẵn:

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `an` | `123456` | Người đăng bài |
| `linh`, `minh` | `123456` | Người đăng bài |
| `mod` | `123456` | Người kiểm duyệt |

Nút **"Khôi phục dữ liệu mẫu"** ở chân trang xóa hết thay đổi và quay về dữ liệu ban đầu.

## 2. Cấu trúc thư mục

```text
StudyHub/
├── index.html        Trang Thảo luận (trang chủ)
├── documents.html    Trang Tài liệu
├── friends.html      Trang Bạn bè
├── profile.html      Trang Cá nhân
├── login.html        Đăng nhập
├── register.html     Đăng ký
├── moderation.html   Trang Kiểm duyệt (chỉ mod)
├── styles.css        Toàn bộ giao diện
├── assets/           Hình ảnh (logo)
└── js/
    ├── data.js        Dữ liệu mẫu + đọc/ghi localStorage
    ├── common.js      Hàm dùng chung: quyền xem, escapeHtml, menu, thông báo
    ├── cards.js       Thẻ bài viết/tài liệu + Thích, Lưu, Bình luận, Báo cáo, Xóa
    ├── discussion.js  Riêng cho index.html
    ├── documents.js   Riêng cho documents.html
    ├── friends.js     Riêng cho friends.html
    ├── profile.js     Riêng cho profile.html
    ├── auth.js        Riêng cho login.html và register.html
    └── moderation.js  Riêng cho moderation.html
```

Mỗi trang HTML nạp các file JS theo thứ tự **data.js → common.js → cards.js → file riêng của trang**. File sau dùng được biến và hàm của file trước.

## 3. Chức năng theo yêu cầu đề bài

### Tác nhân 1: Người đăng bài

| Yêu cầu | Ở đâu | Hàm chính |
|---|---|---|
| Đăng ký, đăng nhập, đăng xuất | `auth.js`, `common.js` | `register()`, `login()`, `logout()` |
| Đăng bài, sửa bài, chọn phạm vi Công khai / Bạn bè / Chỉ mình tôi | `discussion.js` | `submitPost()`, `startEdit()` |
| Thích / Không thích | `cards.js` | `toggleReaction()` |
| Bình luận, đính kèm link ảnh/video, trả lời bình luận | `cards.js` | `submitComment()`, `showReplyForm()`, `mediaHtml()` |
| Chia sẻ, sửa, tìm kiếm, lọc, sắp xếp, lưu, mở tài liệu | `documents.js`, `cards.js` | `submitDocument()`, `renderDocList()`, `toggleSave()` |
| Tìm kiếm, lọc nội dung quan tâm / hữu ích | `discussion.js` | `renderPostList()` |
| Báo cáo nội dung không phù hợp | `cards.js` | `reportContent()` |
| Kết bạn, chấp nhận, từ chối, thu hồi, hủy kết bạn | `friends.js` | `sendRequest()`, `acceptRequest()`, ... |
| Thảo luận, chia sẻ với bạn bè | phạm vi "Bạn bè" + bộ lọc "Bài của bạn bè" | `canView()`, `isFriend()` |
| Xem, sửa thông tin cá nhân, đổi mật khẩu, thống kê | `profile.js` | `renderStats()`, `saveInfo()`, `changePassword()` |

### Tác nhân 2: Người kiểm duyệt (có thêm trang `moderation.html`)

| Yêu cầu | Hàm chính |
|---|---|
| Xem chi tiết rồi Duyệt / Yêu cầu chỉnh sửa / Loại bỏ | `approve()`, `requestEdit()`, `rejectContent()` |
| Xử lý báo cáo: gỡ nội dung, yêu cầu sửa, bỏ qua | `renderReports()`, `ignoreReport()` |
| Hàng chờ có mức ưu tiên Cao / Trung bình / Thấp | `getPriority()` |
| Thống kê: chủ đề được quan tâm, nội dung hữu ích, bài sôi nổi | `renderStats()` |

### Tác nhân 3: Khách (không đăng nhập)

Chỉ xem được bài viết và tài liệu **Công khai đã duyệt**. Bấm Thích, Lưu hay Báo cáo thì web nhắc đăng nhập.

## 4. Những kiến thức chính cần hiểu

**Lưu dữ liệu bằng localStorage.** `localStorage` chỉ lưu được chuỗi. Vì vậy:
- Khi lưu: `JSON.stringify(db)` đổi object thành chuỗi.
- Khi đọc: `JSON.parse(chuoi)` đổi chuỗi lại thành object.
- Biến `db` trong `data.js` chứa toàn bộ dữ liệu. Mỗi lần thay đổi dữ liệu phải gọi `saveData()`.

**Ghi nhớ người đang đăng nhập.** Id của người đó được lưu trong `localStorage` với key `studyhub_current_user`. Hàm `getCurrentUser()` đọc id này ra rồi tìm người dùng tương ứng.

**Quy tắc ai được xem gì** (hàm `canView()` trong `common.js`):
1. Tác giả luôn xem được bài của mình.
2. "Chỉ mình tôi": không ai khác xem được, kể cả mod.
3. Mod xem được mọi bài còn lại, kể cả bài chờ duyệt.
4. Người khác chỉ xem bài **đã duyệt**: Công khai thì ai cũng xem được, Bạn bè thì chỉ bạn bè xem được.

**Quy trình kiểm duyệt:**

```text
Đăng bài (Công khai/Bạn bè) → "Chờ duyệt" → Mod duyệt → "Đã duyệt" (mọi người thấy)
                                         → Mod yêu cầu sửa → "Cần chỉnh sửa" → tác giả sửa → "Chờ duyệt"
                                         → Mod loại bỏ → bị xóa
```

Bài "Chỉ mình tôi" và bài của mod được duyệt luôn.

**Vẽ giao diện bằng JavaScript.** Mỗi trang có hàm `renderPage()`. Hàm này đọc dữ liệu, ghép thành chuỗi HTML rồi gán vào `innerHTML`. Sau mỗi thao tác (thích, lưu, bình luận, ...) chỉ cần gọi lại `renderPage()`.

**Chống XSS bằng `escapeHtml()`.** Mọi chữ do người dùng nhập đều đi qua `escapeHtml()` trước khi đưa vào `innerHTML`. Hàm này đổi `<` thành `&lt;` và các ký tự đặc biệt khác. Nhờ vậy nếu ai đó gõ `<script>` thì trang chỉ hiện ra chữ chứ không chạy code.

**Sự kiện.**
- Form dùng `addEventListener("submit", ...)` và gọi `event.preventDefault()` để trang không bị tải lại.
- Nút trong thẻ do JS tạo ra dùng `onclick="tenHam('id')"`.

**Thông báo khi chuyển trang.** Chuyển trang thì biến JS bị mất, nên thông báo được cất tạm vào `sessionStorage` (`setFlashMessage()`). Trang sau đọc ra và hiện (`showFlashMessage()`).

**Sửa bài.** Bấm "Sửa" sẽ mở `index.html?edit=p1`. File JS đọc tham số `edit` bằng `URLSearchParams` rồi điền dữ liệu bài vào form.

## 5. HTML và CSS

**Các thẻ HTML đã dùng:**

| Nhóm | Thẻ |
|---|---|
| Bố cục | `header`, `nav`, `main`, `section`, `aside`, `article`, `footer` |
| Ảnh, video | `img`, `figure`/`figcaption`, `video`, `iframe` (nhúng YouTube trong bài viết) |
| Bảng | `table`, `thead`, `tbody`, `tr`, `th`, `td` |
| Danh sách | `ul`, `ol`, `dl`/`dt`/`dd` |
| Form | `form`, `input` (text, email, password, url, search, radio, checkbox), `textarea`, `select`, `datalist`, `fieldset`/`legend`, `label`, `button` |
| Khác | `details`/`summary` |

**CSS:**
- Màu khai báo bằng biến trong `:root`.
- Bố cục dùng `flex` và `grid`.
- **Responsive** có 2 mốc:
  - `max-width: 900px` (máy tính bảng): cột phụ chuyển xuống dưới.
  - `max-width: 700px` (điện thoại): menu thu vào nút ☰, các form và lưới chuyển thành 1 cột, bảng cuộn ngang.

## 6. Giới hạn (chấp nhận được với bài tập không có server)

- Dữ liệu chỉ nằm trong trình duyệt đang dùng. Máy khác sẽ không thấy.
- Mật khẩu lưu dạng chữ thường và phân quyền chỉ kiểm tra bằng JavaScript phía trình duyệt. Web thật cần có server và cơ sở dữ liệu.
