// =============================================================
// FILE profile.js - TRANG CÁ NHÂN (profile.html)
// -------------------------------------------------------------
// Chức năng: hiển thị thông tin, thống kê, bảng bài viết và tài liệu
// của tôi, sửa thông tin, đổi mật khẩu, xem nội dung đã lưu.
// =============================================================

const me = requireLogin();

// ---------- VẼ LẠI TRANG ----------
function renderPage() {
  if (me === null) {
    return;
  }
  renderInfo();
  renderStats();
  renderMyPosts();
  renderMyDocs();
  renderSaved();
}

// 1. Thông tin cá nhân
function renderInfo() {
  document.getElementById("profile-avatar").textContent = me.fullName.charAt(0).toUpperCase();
  document.getElementById("profile-name").textContent = me.fullName;
  document.getElementById("info-username").textContent = me.username;
  document.getElementById("info-email").textContent = me.email;
  document.getElementById("info-role").textContent = isMod(me) ? "Người kiểm duyệt" : "Thành viên";
  document.getElementById("info-joined").textContent = new Date(me.createdAt).toLocaleDateString("vi-VN");
  document.getElementById("info-bio").textContent = me.bio === "" ? "(Chưa có giới thiệu)" : me.bio;
}

// 2. Thống kê
function renderStats() {
  let postCount = 0;
  let docCount = 0;
  let likeCount = 0;
  let commentCount = 0;

  for (let i = 0; i < db.posts.length; i++) {
    if (db.posts[i].authorId === me.id) {
      postCount++;
      likeCount += db.posts[i].likes.length;
    }
  }
  for (let i = 0; i < db.documents.length; i++) {
    if (db.documents[i].authorId === me.id) {
      docCount++;
      likeCount += db.documents[i].likes.length;
    }
  }
  for (let i = 0; i < db.comments.length; i++) {
    if (db.comments[i].authorId === me.id) {
      commentCount++;
    }
  }

  document.getElementById("stat-posts").textContent = postCount;
  document.getElementById("stat-docs").textContent = docCount;
  document.getElementById("stat-saved").textContent = me.savedPosts.length + me.savedDocs.length;
  document.getElementById("stat-friends").textContent = me.friends.length;
  document.getElementById("stat-likes").textContent = likeCount;
  document.getElementById("stat-comments").textContent = commentCount;
}

// 3. Bảng bài thảo luận của tôi
function renderMyPosts() {
  let html = "";
  for (let i = 0; i < db.posts.length; i++) {
    const post = db.posts[i];
    if (post.authorId !== me.id) {
      continue;
    }
    html += "<tr>";
    html += "<td>" + escapeHtml(post.title);
    if (post.modNote !== "") {
      html += '<br><small class="text-danger">Yêu cầu sửa: ' + escapeHtml(post.modNote) + "</small>";
    }
    html += "</td>";
    html += "<td>" + scopeBadge(post.scope) + "</td>";
    html += "<td>" + statusBadge(post.status) + "</td>";
    html += "<td>" + post.likes.length + "</td>";
    html += "<td>" + getComments(post.id).length + "</td>";
    html += "<td>" + new Date(post.createdAt).toLocaleDateString("vi-VN") + "</td>";
    html += '<td><a href="index.html?edit=' + post.id + '">Sửa</a> · '
      + '<button class="link-button text-danger" onclick="deleteContent(\'post\', \'' + post.id + '\')">Xóa</button></td>';
    html += "</tr>";
  }
  if (html === "") {
    html = '<tr><td colspan="7">Bạn chưa đăng bài nào. <a href="index.html">Đăng bài ngay</a></td></tr>';
  }
  document.getElementById("my-posts-table").innerHTML = html;
}

// 4. Bảng tài liệu của tôi
function renderMyDocs() {
  let html = "";
  for (let i = 0; i < db.documents.length; i++) {
    const doc = db.documents[i];
    if (doc.authorId !== me.id) {
      continue;
    }
    html += "<tr>";
    html += '<td><a href="' + escapeHtml(doc.link) + '" target="_blank">' + escapeHtml(doc.name) + "</a>";
    if (doc.modNote !== "") {
      html += '<br><small class="text-danger">Yêu cầu sửa: ' + escapeHtml(doc.modNote) + "</small>";
    }
    html += "</td>";
    html += "<td>" + escapeHtml(doc.subject) + "</td>";
    html += "<td>" + scopeBadge(doc.scope) + "</td>";
    html += "<td>" + statusBadge(doc.status) + "</td>";
    html += "<td>" + doc.likes.length + "</td>";
    html += "<td>" + new Date(doc.createdAt).toLocaleDateString("vi-VN") + "</td>";
    html += '<td><a href="documents.html?edit=' + doc.id + '">Sửa</a> · '
      + '<button class="link-button text-danger" onclick="deleteContent(\'document\', \'' + doc.id + '\')">Xóa</button></td>';
    html += "</tr>";
  }
  if (html === "") {
    html = '<tr><td colspan="7">Bạn chưa chia sẻ tài liệu nào. <a href="documents.html">Chia sẻ ngay</a></td></tr>';
  }
  document.getElementById("my-docs-table").innerHTML = html;
}

// 6. Nội dung đã lưu (chỉ hiện những nội dung mình vẫn còn quyền xem)
function renderSaved() {
  let postHtml = "";
  for (let i = 0; i < me.savedPosts.length; i++) {
    const post = findPost(me.savedPosts[i]);
    if (post !== null && canView(me, post)) {
      postHtml += postCardHtml(post);
    }
  }
  document.getElementById("saved-posts").innerHTML = postHtml === "" ? '<p class="empty">Chưa lưu bài viết nào.</p>' : postHtml;

  let docHtml = "";
  for (let i = 0; i < me.savedDocs.length; i++) {
    const doc = findDocument(me.savedDocs[i]);
    if (doc !== null && canView(me, doc)) {
      docHtml += documentCardHtml(doc);
    }
  }
  document.getElementById("saved-docs").innerHTML = docHtml === "" ? '<p class="empty">Chưa lưu tài liệu nào.</p>' : docHtml;
}

// ---------- SỬA THÔNG TIN ----------

// Điền thông tin hiện tại vào form
function fillInfoForm() {
  document.getElementById("edit-fullname").value = me.fullName;
  document.getElementById("edit-email").value = me.email;
  document.getElementById("edit-bio").value = me.bio;
}

function saveInfo(event) {
  event.preventDefault();
  const fullName = document.getElementById("edit-fullname").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const bio = document.getElementById("edit-bio").value.trim();

  if (fullName.length < 2) {
    showToast("Họ tên cần ít nhất 2 ký tự.", "error");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    showToast("Email không hợp lệ.", "error");
    return;
  }
  // Email không được trùng với người khác
  for (let i = 0; i < db.users.length; i++) {
    if (db.users[i].id !== me.id && db.users[i].email.toLowerCase() === email.toLowerCase()) {
      showToast("Email này đã có người sử dụng.", "error");
      return;
    }
  }

  me.fullName = fullName;
  me.email = email;
  me.bio = bio;
  saveData();
  renderHeader(); // cập nhật tên trên thanh menu
  renderPage();
  showToast("Đã cập nhật thông tin cá nhân.", "success");
}

function changePassword(event) {
  event.preventDefault();
  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (oldPassword !== me.password) {
    showToast("Mật khẩu hiện tại không đúng.", "error");
    return;
  }
  if (newPassword.length < 6) {
    showToast("Mật khẩu mới cần ít nhất 6 ký tự.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast("Nhập lại mật khẩu không khớp.", "error");
    return;
  }

  me.password = newPassword;
  saveData();
  document.getElementById("password-form").reset();
  showToast("Đổi mật khẩu thành công.", "success");
}

// ---------- CHẠY KHI MỞ TRANG ----------
if (me !== null) {
  document.getElementById("info-form").addEventListener("submit", saveInfo);
  document.getElementById("password-form").addEventListener("submit", changePassword);
  fillInfoForm();
  renderPage();
}
