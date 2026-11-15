// =============================================================
// FILE moderation.js - TRANG KIỂM DUYỆT (moderation.html)
// -------------------------------------------------------------
// Chỉ người kiểm duyệt (role = "mod") được vào trang này.
// Gồm 3 tab:
//  1. Hàng chờ duyệt: duyệt / yêu cầu sửa / loại bỏ nội dung.
//  2. Báo cáo: xử lý các báo cáo của người dùng.
//  3. Thống kê: chủ đề được quan tâm, nội dung hữu ích, ...
// =============================================================

const me = requireLogin();
if (me !== null && !isMod(me)) {
  setFlashMessage("Chỉ người kiểm duyệt mới vào được trang này.");
  location.href = "index.html";
}

// ---------- CHUYỂN TAB ----------
function showTab(name) {
  const names = ["queue", "reports", "stats"];
  for (let i = 0; i < names.length; i++) {
    const isActive = names[i] === name;
    document.getElementById("panel-" + names[i]).style.display = isActive ? "block" : "none";
    if (isActive) {
      document.getElementById("tab-" + names[i]).classList.add("active");
    } else {
      document.getElementById("tab-" + names[i]).classList.remove("active");
    }
  }
}

// ---------- HÀM HỖ TRỢ ----------

// Gom bài viết và tài liệu thành 1 danh sách chung để dễ xử lý.
// Mỗi phần tử: { type, item, title, text, topic }
// Chỉ lấy nội dung mod được xem (không lấy "Chỉ mình tôi" của người khác)
function getAllContent() {
  const result = [];
  for (let i = 0; i < db.posts.length; i++) {
    const post = db.posts[i];
    if (canView(me, post)) {
      result.push({ type: "post", item: post, title: post.title, text: post.content, topic: post.topic });
    }
  }
  for (let i = 0; i < db.documents.length; i++) {
    const doc = db.documents[i];
    if (canView(me, doc)) {
      result.push({ type: "document", item: doc, title: doc.name, text: doc.description, topic: doc.subject });
    }
  }
  return result;
}

function typeText(type) {
  return type === "post" ? "Bài viết" : "Tài liệu";
}

// Đếm số báo cáo chưa xử lý của một nội dung
function countOpenReports(itemId) {
  let count = 0;
  for (let i = 0; i < db.reports.length; i++) {
    if (db.reports[i].targetId === itemId && db.reports[i].status === "open") {
      count++;
    }
  }
  return count;
}

// Tính mức ưu tiên: 3 = Cao, 2 = Trung bình, 1 = Thấp
function getPriority(item) {
  if (countOpenReports(item.id) > 0) {
    return 3;
  }
  const waitDays = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (waitDays >= 2) {
    return 2;
  }
  return 1;
}

function priorityBadge(level) {
  if (level === 3) return '<span class="badge badge-high">Ưu tiên cao</span>';
  if (level === 2) return '<span class="badge badge-medium">Ưu tiên trung bình</span>';
  return '<span class="badge badge-low">Ưu tiên thấp</span>';
}

// Đóng mọi báo cáo đang mở của một nội dung, ghi lại kết quả
function closeReports(itemId, result) {
  for (let i = 0; i < db.reports.length; i++) {
    if (db.reports[i].targetId === itemId && db.reports[i].status === "open") {
      db.reports[i].status = "done";
      db.reports[i].result = result;
    }
  }
}

// Phần chi tiết nội dung (dùng cho cả hàng chờ và báo cáo)
function contentDetailHtml(entry) {
  const item = entry.item;
  let html = "<h3>" + escapeHtml(entry.title) + "</h3>";
  html += '<p class="muted">' + typeText(entry.type) + " · Tác giả: <b>" + escapeHtml(getUserName(item.authorId))
    + "</b> · " + formatDate(item.createdAt) + " · Chủ đề: " + escapeHtml(entry.topic) + "</p>";
  html += '<p class="post-content">' + escapeHtml(entry.text) + "</p>";
  if (entry.type === "post") {
    html += mediaHtml(item.media);
  } else {
    html += '<p>Link: <a href="' + escapeHtml(item.link) + '" target="_blank">' + escapeHtml(item.link) + "</a></p>";
  }
  return html;
}

// ---------- TAB 1: HÀNG CHỜ DUYỆT ----------
function renderQueue() {
  const all = getAllContent();
  const pending = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].item.status === "pending") {
      pending.push(all[i]);
    }
  }

  // Ưu tiên cao xếp trước; cùng mức thì nội dung gửi lâu hơn xếp trước
  pending.sort(function (a, b) {
    const diff = getPriority(b.item) - getPriority(a.item);
    if (diff !== 0) {
      return diff;
    }
    return new Date(a.item.createdAt) - new Date(b.item.createdAt);
  });

  document.getElementById("queue-count").textContent = pending.length;

  let html = "";
  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    const item = entry.item;
    html += '<article class="card">';
    html += '<div class="badges">' + priorityBadge(getPriority(item)) + scopeBadge(item.scope)
      + '<span class="badge">' + countOpenReports(item.id) + " báo cáo</span></div>";
    html += contentDetailHtml(entry);
    html += '<div class="actions">';
    html += '<button class="btn btn-small" onclick="approve(\'' + entry.type + '\', \'' + item.id + '\')">✔ Duyệt</button>';
    html += '<button class="btn btn-small btn-outline" onclick="requestEdit(\'' + entry.type + '\', \'' + item.id + '\')">✏️ Yêu cầu chỉnh sửa</button>';
    html += '<button class="btn btn-small btn-danger" onclick="rejectContent(\'' + entry.type + '\', \'' + item.id + '\')">✖ Loại bỏ</button>';
    html += "</div></article>";
  }
  document.getElementById("queue-list").innerHTML = html === "" ? '<p class="empty">Không có nội dung nào chờ duyệt. 🎉</p>' : html;

  // Bảng nội dung đang chờ tác giả sửa
  let tableHtml = "";
  for (let i = 0; i < all.length; i++) {
    if (all[i].item.status === "needs-edit") {
      tableHtml += "<tr><td>" + typeText(all[i].type) + "</td><td>" + escapeHtml(all[i].title) + "</td><td>"
        + escapeHtml(getUserName(all[i].item.authorId)) + "</td><td>" + escapeHtml(all[i].item.modNote) + "</td></tr>";
    }
  }
  document.getElementById("needs-edit-table").innerHTML = tableHtml === "" ? '<tr><td colspan="4">Không có.</td></tr>' : tableHtml;
}

function approve(type, id) {
  const item = findItem(type, id);
  item.status = "approved";
  item.modNote = "";
  saveData();
  renderPage();
  showToast("Đã duyệt nội dung.", "success");
}

function requestEdit(type, id) {
  const note = prompt("Ghi chú cho tác giả: cần sửa những gì?");
  if (note === null) {
    return;
  }
  if (note.trim().length < 5) {
    showToast("Ghi chú cần ít nhất 5 ký tự.", "error");
    return;
  }
  const item = findItem(type, id);
  item.status = "needs-edit";
  item.modNote = note.trim();
  closeReports(id, "Yêu cầu tác giả chỉnh sửa");
  saveData();
  renderPage();
  showToast("Đã gửi yêu cầu chỉnh sửa cho tác giả.", "success");
}

function rejectContent(type, id) {
  if (!confirm("Loại bỏ nội dung này khỏi StudyHub?")) {
    return;
  }
  removeContent(type, id); // hàm trong cards.js, tự đóng báo cáo liên quan
  renderPage();
  showToast("Đã loại bỏ nội dung.", "success");
}

// ---------- TAB 2: BÁO CÁO ----------
function renderReports() {
  let html = "";
  let openCount = 0;

  for (let i = 0; i < db.reports.length; i++) {
    const report = db.reports[i];
    if (report.status !== "open") {
      continue;
    }
    const item = findItem(report.type, report.targetId);
    if (item === null) {
      // Nội dung đã bị xóa trước đó -> tự đóng báo cáo
      report.status = "done";
      report.result = "Nội dung không còn tồn tại";
      saveData();
      continue;
    }
    openCount++;

    const entry = {
      type: report.type,
      item: item,
      title: report.type === "post" ? item.title : item.name,
      text: report.type === "post" ? item.content : item.description,
      topic: report.type === "post" ? item.topic : item.subject
    };

    html += '<article class="card report-card">';
    html += '<p class="mod-note"><b>Lý do báo cáo:</b> ' + escapeHtml(report.reason) + "<br>"
      + "Người báo cáo: " + escapeHtml(getUserName(report.reporterId)) + " · " + formatDate(report.createdAt) + "</p>";
    html += '<div class="badges">' + scopeBadge(item.scope) + statusBadge(item.status)
      + '<span class="badge">' + countOpenReports(item.id) + " báo cáo</span></div>";
    html += contentDetailHtml(entry);
    html += '<div class="actions">';
    html += '<button class="btn btn-small btn-danger" onclick="rejectContent(\'' + report.type + '\', \'' + item.id + '\')">Gỡ nội dung</button>';
    html += '<button class="btn btn-small btn-outline" onclick="requestEdit(\'' + report.type + '\', \'' + item.id + '\')">Yêu cầu chỉnh sửa</button>';
    html += '<button class="btn btn-small btn-outline" onclick="ignoreReport(\'' + report.id + '\')">Bỏ qua (không vi phạm)</button>';
    html += "</div></article>";
  }

  document.getElementById("report-count").textContent = openCount;
  document.getElementById("report-list").innerHTML = html === "" ? '<p class="empty">Không có báo cáo nào cần xử lý.</p>' : html;

  // Lịch sử báo cáo đã xử lý (mới nhất ở trên)
  let historyHtml = "";
  for (let i = db.reports.length - 1; i >= 0; i--) {
    const report = db.reports[i];
    if (report.status === "done") {
      historyHtml += "<tr><td>" + formatDate(report.createdAt) + "</td><td>" + escapeHtml(getUserName(report.reporterId))
        + "</td><td>" + escapeHtml(report.reason) + "</td><td>" + escapeHtml(report.result) + "</td></tr>";
    }
  }
  document.getElementById("report-history").innerHTML = historyHtml === "" ? '<tr><td colspan="4">Chưa có.</td></tr>' : historyHtml;
}

function ignoreReport(reportId) {
  for (let i = 0; i < db.reports.length; i++) {
    if (db.reports[i].id === reportId) {
      db.reports[i].status = "done";
      db.reports[i].result = "Bỏ qua - nội dung không vi phạm";
    }
  }
  saveData();
  renderPage();
  showToast("Đã bỏ qua báo cáo.", "success");
}

// ---------- TAB 3: THỐNG KÊ ----------
function renderStats() {
  const all = getAllContent();

  // Các con số tổng quan
  let postCount = 0;
  let docCount = 0;
  let pendingCount = 0;
  for (let i = 0; i < all.length; i++) {
    if (all[i].type === "post") {
      postCount++;
    } else {
      docCount++;
    }
    if (all[i].item.status === "pending") {
      pendingCount++;
    }
  }
  let openReports = 0;
  for (let i = 0; i < db.reports.length; i++) {
    if (db.reports[i].status === "open") {
      openReports++;
    }
  }
  document.getElementById("stat-users").textContent = db.users.length;
  document.getElementById("stat-posts").textContent = postCount;
  document.getElementById("stat-docs").textContent = docCount;
  document.getElementById("stat-comments").textContent = db.comments.length;
  document.getElementById("stat-pending").textContent = pendingCount;
  document.getElementById("stat-reports").textContent = openReports;

  // Bảng chủ đề được quan tâm
  const topics = []; // { name, count, comments, likes }
  for (let i = 0; i < all.length; i++) {
    let found = null;
    for (let j = 0; j < topics.length; j++) {
      if (topics[j].name === all[i].topic) {
        found = topics[j];
      }
    }
    if (found === null) {
      found = { name: all[i].topic, count: 0, comments: 0, likes: 0 };
      topics.push(found);
    }
    found.count++;
    found.likes += all[i].item.likes.length;
    if (all[i].type === "post") {
      found.comments += getComments(all[i].item.id).length;
    }
  }
  // Sắp xếp: nhiều nội dung hơn đứng trước, bằng nhau thì xét tổng bình luận + thích
  topics.sort(function (a, b) {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return (b.comments + b.likes) - (a.comments + a.likes);
  });
  let topicHtml = "";
  for (let i = 0; i < topics.length && i < 8; i++) {
    topicHtml += "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(topics[i].name) + "</td><td>" + topics[i].count
      + "</td><td>" + topics[i].comments + "</td><td>" + topics[i].likes + "</td></tr>";
  }
  document.getElementById("topic-table").innerHTML = topicHtml;

  // Top 5 nội dung hữu ích (đã duyệt), điểm = thích - không thích
  const approved = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].item.status === "approved") {
      approved.push(all[i]);
    }
  }
  approved.sort(function (a, b) {
    return (b.item.likes.length - b.item.dislikes.length) - (a.item.likes.length - a.item.dislikes.length);
  });
  let helpfulHtml = "";
  for (let i = 0; i < approved.length && i < 5; i++) {
    const score = approved[i].item.likes.length - approved[i].item.dislikes.length;
    helpfulHtml += "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(approved[i].title) + "</td><td>"
      + typeText(approved[i].type) + "</td><td>" + score + "</td></tr>";
  }
  document.getElementById("helpful-table").innerHTML = helpfulHtml;

  // Top 5 bài viết có nhiều bình luận nhất
  const posts = [];
  for (let i = 0; i < approved.length; i++) {
    if (approved[i].type === "post") {
      posts.push(approved[i]);
    }
  }
  posts.sort(function (a, b) {
    return getComments(b.item.id).length - getComments(a.item.id).length;
  });
  let discussedHtml = "";
  for (let i = 0; i < posts.length && i < 5; i++) {
    discussedHtml += "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(posts[i].title) + "</td><td>"
      + getComments(posts[i].item.id).length + "</td></tr>";
  }
  document.getElementById("discussed-table").innerHTML = discussedHtml;
}

// ---------- VẼ LẠI TRANG ----------
function renderPage() {
  if (me === null || !isMod(me)) {
    return;
  }
  renderQueue();
  renderReports();
  renderStats();
}

renderPage();
