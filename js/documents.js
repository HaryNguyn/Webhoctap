// =============================================================
// FILE documents.js - TRANG TÀI LIỆU (documents.html)
// -------------------------------------------------------------
// Chức năng: chia sẻ, sửa, tìm kiếm, lọc, sắp xếp tài liệu.
// (Thích, lưu, báo cáo, xóa nằm trong cards.js)
// =============================================================

// Id tài liệu đang sửa ("" nghĩa là đang chia sẻ tài liệu mới)
let editingDocId = "";

// ---------- VẼ LẠI TRANG ----------
function renderPage() {
  const user = getCurrentUser();

  document.getElementById("guest-box").style.display = user === null ? "block" : "none";
  document.getElementById("composer").style.display = user === null ? "none" : "block";

  const loginOptions = document.querySelectorAll(".need-login");
  for (let i = 0; i < loginOptions.length; i++) {
    loginOptions[i].disabled = user === null;
  }

  renderSubjectFilter();
  renderDocList();
}

// Lấy các tài liệu mà người dùng hiện tại được phép xem
function getVisibleDocs() {
  const user = getCurrentUser();
  const result = [];
  for (let i = 0; i < db.documents.length; i++) {
    if (canView(user, db.documents[i])) {
      result.push(db.documents[i]);
    }
  }
  return result;
}

// Tạo danh sách môn học cho ô lọc
function renderSubjectFilter() {
  const select = document.getElementById("subject-filter");
  const oldValue = select.value;
  const docs = getVisibleDocs();

  const subjects = [];
  for (let i = 0; i < docs.length; i++) {
    if (!subjects.includes(docs[i].subject)) {
      subjects.push(docs[i].subject);
    }
  }
  subjects.sort();

  let html = '<option value="">Tất cả môn học</option>';
  for (let i = 0; i < subjects.length; i++) {
    html += '<option value="' + escapeHtml(subjects[i]) + '">' + escapeHtml(subjects[i]) + "</option>";
  }
  select.innerHTML = html;
  select.value = oldValue;
}

// Vẽ danh sách tài liệu sau khi tìm kiếm, lọc, sắp xếp
function renderDocList() {
  const user = getCurrentUser();
  const keyword = document.getElementById("search-input").value.trim().toLowerCase();
  const subject = document.getElementById("subject-filter").value;
  const type = document.getElementById("type-filter").value;
  const sort = document.getElementById("sort-select").value;

  const allDocs = getVisibleDocs();
  const docs = [];

  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const text = (doc.name + " " + doc.description + " " + doc.subject).toLowerCase();

    if (keyword !== "" && !text.includes(keyword)) {
      continue;
    }
    if (subject !== "" && doc.subject !== subject) {
      continue;
    }
    if (type === "helpful" && doc.likes.length <= doc.dislikes.length) {
      continue;
    }
    if (type === "mine" && (user === null || doc.authorId !== user.id)) {
      continue;
    }
    if (type === "friends" && !isFriend(user, doc.authorId)) {
      continue;
    }
    if (type === "saved" && (user === null || !user.savedDocs.includes(doc.id))) {
      continue;
    }
    docs.push(doc);
  }

  docs.sort(function (a, b) {
    if (sort === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sort === "likes") {
      return b.likes.length - a.likes.length;
    }
    if (sort === "name") {
      return a.name.localeCompare(b.name); // so sánh chữ theo bảng chữ cái
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  document.getElementById("result-count").textContent = "Tìm thấy " + docs.length + " tài liệu";
  const list = document.getElementById("doc-list");
  if (docs.length === 0) {
    list.innerHTML = '<p class="empty">Không có tài liệu nào phù hợp.</p>';
    return;
  }
  let html = "";
  for (let i = 0; i < docs.length; i++) {
    html += documentCardHtml(docs[i]);
  }
  list.innerHTML = html;
}

// ---------- CHIA SẺ / SỬA TÀI LIỆU ----------

function getCheckedScope() {
  const radios = document.getElementsByName("doc-scope");
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i].value;
    }
  }
  return "public";
}

function setCheckedScope(scope) {
  const radios = document.getElementsByName("doc-scope");
  for (let i = 0; i < radios.length; i++) {
    radios[i].checked = radios[i].value === scope;
  }
}

function submitDocument(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (user === null) {
    return;
  }

  const name = document.getElementById("doc-name").value.trim();
  const subject = document.getElementById("doc-subject").value.trim();
  const link = document.getElementById("doc-link").value.trim();
  const description = document.getElementById("doc-description").value.trim();
  const scope = getCheckedScope();

  if (name.length < 3) {
    showToast("Tên tài liệu cần ít nhất 3 ký tự.", "error");
    return;
  }
  if (subject === "") {
    showToast("Vui lòng nhập môn học.", "error");
    return;
  }
  if (!isValidLink(link)) {
    showToast("Link tài liệu phải bắt đầu bằng http:// hoặc https://", "error");
    return;
  }
  if (description.length < 10) {
    showToast("Mô tả cần ít nhất 10 ký tự.", "error");
    return;
  }

  let status = "pending";
  if (isMod(user) || scope === "onlyme") {
    status = "approved";
  }

  if (editingDocId === "") {
    db.documents.push({
      id: createId("d"),
      authorId: user.id,
      name: name,
      link: link,
      subject: subject,
      description: description,
      scope: scope,
      status: status,
      modNote: "",
      likes: [],
      dislikes: [],
      createdAt: new Date().toISOString()
    });
    saveData();
    document.getElementById("doc-form").reset();
    renderPage();
    showToast(status === "pending" ? "Đã gửi tài liệu, vui lòng chờ kiểm duyệt." : "Đã chia sẻ tài liệu.", "success");
  } else {
    const doc = findDocument(editingDocId);
    doc.name = name;
    doc.link = link;
    doc.subject = subject;
    doc.description = description;
    doc.scope = scope;
    doc.status = status;
    doc.modNote = "";
    doc.updatedAt = new Date().toISOString();
    saveData();
    setFlashMessage(status === "pending" ? "Đã lưu, tài liệu đang chờ duyệt lại." : "Đã lưu thay đổi.");
    location.href = "documents.html";
  }
}

// Mở form ở chế độ sửa (documents.html?edit=d1)
function startEdit(docId) {
  const user = getCurrentUser();
  const doc = findDocument(docId);
  if (doc === null || user === null || doc.authorId !== user.id) {
    showToast("Bạn chỉ có thể sửa tài liệu của mình.", "error");
    return;
  }

  editingDocId = docId;
  document.getElementById("form-title").textContent = "Sửa tài liệu";
  document.getElementById("submit-doc").textContent = "Lưu thay đổi";
  document.getElementById("cancel-edit").style.display = "inline-block";

  document.getElementById("doc-name").value = doc.name;
  document.getElementById("doc-subject").value = doc.subject;
  document.getElementById("doc-link").value = doc.link;
  document.getElementById("doc-description").value = doc.description;
  setCheckedScope(doc.scope);

  if (doc.modNote !== "") {
    const note = document.getElementById("edit-note");
    note.textContent = "Kiểm duyệt yêu cầu sửa: " + doc.modNote;
    note.style.display = "block";
  }
  document.getElementById("composer").scrollIntoView();
}

function cancelEdit() {
  location.href = "documents.html";
}

// ---------- CHẠY KHI MỞ TRANG ----------
document.getElementById("doc-form").addEventListener("submit", submitDocument);
renderPage();

const params = new URLSearchParams(location.search);
if (params.get("edit") !== null) {
  startEdit(params.get("edit"));
}
