// =============================================================
// FILE common.js - CÁC HÀM DÙNG CHUNG CHO MỌI TRANG
// -------------------------------------------------------------
// Gồm: tìm người dùng, kiểm tra quyền xem, xử lý chữ an toàn,
// định dạng ngày, thanh menu, thông báo nhỏ (toast).
// =============================================================

// ---------- 1. NGƯỜI DÙNG ĐANG ĐĂNG NHẬP ----------

// Trả về người dùng đang đăng nhập, hoặc null nếu là khách
function getCurrentUser() {
  const userId = localStorage.getItem(LOGIN_KEY);
  if (userId === null) {
    return null;
  }
  return findUser(userId);
}

// Tìm người dùng theo id
function findUser(userId) {
  for (let i = 0; i < db.users.length; i++) {
    if (db.users[i].id === userId) {
      return db.users[i];
    }
  }
  return null;
}

// Lấy tên hiển thị của người dùng theo id
function getUserName(userId) {
  const user = findUser(userId);
  if (user === null) {
    return "Tài khoản đã xóa";
  }
  return user.fullName;
}

// Kiểm tra người dùng có phải người kiểm duyệt không
function isMod(user) {
  return user !== null && user.role === "mod";
}

// Bắt buộc đăng nhập: nếu là khách thì chuyển sang trang đăng nhập
function requireLogin() {
  const user = getCurrentUser();
  if (user === null) {
    setFlashMessage("Bạn cần đăng nhập để vào trang này.");
    location.href = "login.html";
  }
  return user;
}

// Đăng xuất
function logout() {
  localStorage.removeItem(LOGIN_KEY);
  setFlashMessage("Bạn đã đăng xuất.");
  location.href = "index.html";
}

// ---------- 2. QUYỀN XEM NỘI DUNG ----------

// Hai người có phải bạn bè không
function isFriend(user, otherId) {
  if (user === null) {
    return false;
  }
  return user.friends.includes(otherId);
}

// Kiểm tra "user" có được xem bài viết / tài liệu "item" không
// Quy tắc:
//  1. Tác giả luôn xem được bài của mình.
//  2. Bài "Chỉ mình tôi" thì không ai khác xem được (kể cả mod).
//  3. Mod xem được mọi bài còn lại (kể cả bài chờ duyệt).
//  4. Người khác chỉ xem được bài ĐÃ DUYỆT:
//     - Công khai: ai cũng xem được (kể cả khách).
//     - Bạn bè: chỉ bạn bè của tác giả xem được.
function canView(user, item) {
  if (user !== null && user.id === item.authorId) {
    return true;
  }
  if (item.scope === "onlyme") {
    return false;
  }
  if (isMod(user)) {
    return true;
  }
  if (item.status !== "approved") {
    return false;
  }
  if (item.scope === "public") {
    return true;
  }
  return isFriend(user, item.authorId);
}

// ---------- 3. XỬ LÝ CHỮ & ĐỊNH DẠNG ----------

// Đổi các ký tự đặc biệt của HTML thành dạng an toàn.
// Mục đích: nếu người dùng gõ "<script>" thì chỉ hiện ra chữ,
// không bị trình duyệt chạy như code (chống tấn công XSS).
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Link hợp lệ phải bắt đầu bằng http:// hoặc https://
function isValidLink(link) {
  return link.startsWith("http://") || link.startsWith("https://");
}

// Đổi thời gian dạng ISO thành dạng dễ đọc, ví dụ "14:30 12/10/2026"
function formatDate(isoText) {
  const date = new Date(isoText);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    + " " + date.toLocaleDateString("vi-VN");
}

// Chữ hiển thị của phạm vi
function scopeText(scope) {
  if (scope === "public") return "Công khai";
  if (scope === "friends") return "Bạn bè";
  return "Chỉ mình tôi";
}

// Chữ hiển thị của trạng thái kiểm duyệt
function statusText(status) {
  if (status === "approved") return "Đã duyệt";
  if (status === "pending") return "Chờ duyệt";
  return "Cần chỉnh sửa";
}

// Tạo huy hiệu (badge) phạm vi và trạng thái
function scopeBadge(scope) {
  return '<span class="badge badge-' + scope + '">' + scopeText(scope) + "</span>";
}

function statusBadge(status) {
  return '<span class="badge badge-' + status + '">' + statusText(status) + "</span>";
}

// Ảnh đại diện: lấy chữ cái đầu của tên
function avatarHtml(userId) {
  const name = getUserName(userId);
  return '<span class="avatar">' + escapeHtml(name.charAt(0).toUpperCase()) + "</span>";
}

// Hiển thị ảnh / video từ đường link người dùng đính kèm
function mediaHtml(link) {
  if (link === "" || !isValidLink(link)) {
    return "";
  }
  const safeLink = escapeHtml(link);
  const lower = link.toLowerCase();

  // Link ảnh
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
    || lower.endsWith(".gif") || lower.endsWith(".webp")) {
    return '<img class="media" src="' + safeLink + '" alt="Ảnh đính kèm">';
  }

  // Link video
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) {
    return '<video class="media" src="' + safeLink + '" controls></video>';
  }

  // Link YouTube: lấy mã video rồi nhúng bằng thẻ iframe
  let videoId = "";
  if (link.includes("youtube.com/watch?v=")) {
    videoId = link.split("v=")[1].split("&")[0];
  } else if (link.includes("youtu.be/")) {
    videoId = link.split("youtu.be/")[1].split("?")[0];
  }
  if (videoId !== "") {
    return '<iframe class="media media-youtube" src="https://www.youtube.com/embed/' + escapeHtml(videoId)
      + '" title="Video YouTube" allowfullscreen></iframe>';
  }

  // Link khác: hiện thành đường link bình thường
  return '<a class="media-link" href="' + safeLink + '" target="_blank">Mở liên kết đính kèm</a>';
}

// ---------- 4. THÔNG BÁO NHỎ (TOAST) ----------

// Hiện một thông báo ở góc màn hình rồi tự ẩn sau 3 giây
// type = "success" (xanh) hoặc "error" (đỏ)
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + (type === "error" ? "toast-error" : "toast-success");
  setTimeout(function () {
    toast.className = "toast";
  }, 3000);
}

// Khi chuyển sang trang khác, biến JS bị mất.
// Vì vậy ta cất tạm thông báo vào sessionStorage, trang sau sẽ đọc ra và hiện.
function setFlashMessage(message) {
  sessionStorage.setItem("flash", message);
}

function showFlashMessage() {
  const message = sessionStorage.getItem("flash");
  if (message !== null) {
    sessionStorage.removeItem("flash");
    showToast(message, "success");
  }
}

// ---------- 5. THANH MENU (HEADER) ----------

// Cập nhật thanh menu theo trạng thái đăng nhập
function renderHeader() {
  const user = getCurrentUser();
  const userArea = document.getElementById("user-area");

  // Các link chỉ dành cho thành viên đã đăng nhập (Bạn bè, Cá nhân)
  const memberLinks = document.querySelectorAll(".member-only");
  for (let i = 0; i < memberLinks.length; i++) {
    memberLinks[i].style.display = user === null ? "none" : "";
  }

  // Link Kiểm duyệt chỉ hiện với mod
  const modLink = document.getElementById("mod-link");
  modLink.style.display = isMod(user) ? "" : "none";

  if (user === null) {
    userArea.innerHTML =
      '<a class="btn btn-outline btn-small" href="login.html">Đăng nhập</a>' +
      '<a class="btn btn-small" href="register.html">Đăng ký</a>';
  } else {
    userArea.innerHTML =
      avatarHtml(user.id) +
      '<span class="user-name">' + escapeHtml(user.fullName) + (isMod(user) ? " (Mod)" : "") + "</span>" +
      '<button class="btn btn-outline btn-small" onclick="logout()">Đăng xuất</button>';
  }
}

// Bật / tắt menu trên điện thoại (nút ☰)
function toggleMenu() {
  const nav = document.getElementById("main-nav");
  nav.classList.toggle("open");
}

// Chạy khi mở bất kỳ trang nào
renderHeader();
showFlashMessage();
