// =============================================================
// FILE discussion.js - TRANG THẢO LUẬN (index.html)
// -------------------------------------------------------------
// Chức năng: đăng bài, sửa bài, tìm kiếm, lọc, sắp xếp bài viết.
// (Thích, lưu, bình luận, báo cáo nằm trong cards.js)
// =============================================================

// Id bài đang sửa ("" nghĩa là đang tạo bài mới)
let editingPostId = "";

// ---------- VẼ LẠI TRANG ----------
function renderPage() {
  const user = getCurrentUser();

  // Khách: hiện banner + lời nhắc; Thành viên: hiện form đăng bài
  document.getElementById("hero").style.display = user === null ? "block" : "none";
  document.getElementById("guest-box").style.display = user === null ? "block" : "none";
  document.getElementById("composer").style.display = user === null ? "none" : "block";

  // Khách không dùng được bộ lọc "Bài của tôi", "Bạn bè", "Đã lưu"
  const loginOptions = document.querySelectorAll(".need-login");
  for (let i = 0; i < loginOptions.length; i++) {
    loginOptions[i].disabled = user === null;
  }

  renderTopicFilter();
  renderPostList();
  renderHotTopics();
}

// Lấy các bài mà người dùng hiện tại được phép xem
function getVisiblePosts() {
  const user = getCurrentUser();
  const result = [];
  for (let i = 0; i < db.posts.length; i++) {
    if (canView(user, db.posts[i])) {
      result.push(db.posts[i]);
    }
  }
  return result;
}

// Tạo các lựa chọn trong ô "Tất cả chủ đề" từ dữ liệu thật
function renderTopicFilter() {
  const select = document.getElementById("topic-filter");
  const oldValue = select.value; // nhớ lựa chọn cũ
  const posts = getVisiblePosts();

  // Lấy danh sách chủ đề, không trùng lặp
  const topics = [];
  for (let i = 0; i < posts.length; i++) {
    if (!topics.includes(posts[i].topic)) {
      topics.push(posts[i].topic);
    }
  }
  topics.sort();

  let html = '<option value="">Tất cả chủ đề</option>';
  for (let i = 0; i < topics.length; i++) {
    html += '<option value="' + escapeHtml(topics[i]) + '">' + escapeHtml(topics[i]) + "</option>";
  }
  select.innerHTML = html;
  select.value = oldValue; // chọn lại giá trị cũ
}

// Vẽ danh sách bài viết sau khi tìm kiếm, lọc và sắp xếp
function renderPostList() {
  const user = getCurrentUser();
  const keyword = document.getElementById("search-input").value.trim().toLowerCase();
  const topic = document.getElementById("topic-filter").value;
  const type = document.getElementById("type-filter").value;
  const sort = document.getElementById("sort-select").value;

  const allPosts = getVisiblePosts();
  const posts = [];

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];

    // 1. Tìm theo từ khóa
    const text = (post.title + " " + post.content + " " + post.topic).toLowerCase();
    if (keyword !== "" && !text.includes(keyword)) {
      continue;
    }
    // 2. Lọc theo chủ đề
    if (topic !== "" && post.topic !== topic) {
      continue;
    }
    // 3. Lọc theo loại
    if (type === "helpful" && post.likes.length <= post.dislikes.length) {
      continue;
    }
    if (type === "interested" && getComments(post.id).length === 0) {
      continue;
    }
    if (type === "mine" && (user === null || post.authorId !== user.id)) {
      continue;
    }
    if (type === "friends" && !isFriend(user, post.authorId)) {
      continue;
    }
    if (type === "saved" && (user === null || !user.savedPosts.includes(post.id))) {
      continue;
    }
    posts.push(post);
  }

  // 4. Sắp xếp. Hàm so sánh trả về số âm thì a đứng trước b.
  posts.sort(function (a, b) {
    if (sort === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sort === "likes") {
      return b.likes.length - a.likes.length;
    }
    if (sort === "comments") {
      return getComments(b.id).length - getComments(a.id).length;
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // mới nhất
  });

  // 5. Hiển thị
  document.getElementById("result-count").textContent = "Tìm thấy " + posts.length + " bài viết";
  const list = document.getElementById("post-list");
  if (posts.length === 0) {
    list.innerHTML = '<p class="empty">Không có bài viết nào phù hợp.</p>';
    return;
  }
  let html = "";
  for (let i = 0; i < posts.length; i++) {
    html += postCardHtml(posts[i]);
  }
  list.innerHTML = html;
}

// Chủ đề nổi bật: đếm số bài của mỗi chủ đề, lấy 5 chủ đề nhiều nhất
function renderHotTopics() {
  const posts = getVisiblePosts();
  const topics = []; // mỗi phần tử: { name: "Toán học", count: 2 }

  for (let i = 0; i < posts.length; i++) {
    let found = null;
    for (let j = 0; j < topics.length; j++) {
      if (topics[j].name === posts[i].topic) {
        found = topics[j];
      }
    }
    if (found === null) {
      topics.push({ name: posts[i].topic, count: 1 });
    } else {
      found.count++;
    }
  }

  topics.sort(function (a, b) {
    return b.count - a.count;
  });

  let html = "";
  for (let i = 0; i < topics.length && i < 5; i++) {
    html += "<li><span>" + escapeHtml(topics[i].name) + "</span><b>" + topics[i].count + " bài</b></li>";
  }
  document.getElementById("hot-topics").innerHTML = html === "" ? "<li>Chưa có chủ đề</li>" : html;
}

// ---------- ĐĂNG BÀI / SỬA BÀI ----------

// Lấy giá trị của nút radio đang được chọn
function getCheckedScope() {
  const radios = document.getElementsByName("post-scope");
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i].value;
    }
  }
  return "public";
}

function setCheckedScope(scope) {
  const radios = document.getElementsByName("post-scope");
  for (let i = 0; i < radios.length; i++) {
    radios[i].checked = radios[i].value === scope;
  }
}

// Xử lý khi bấm nút "Đăng bài" / "Lưu thay đổi"
function submitPost(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (user === null) {
    return;
  }

  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const topic = document.getElementById("post-topic").value.trim();
  const media = document.getElementById("post-media").value.trim();
  const scope = getCheckedScope();

  // Kiểm tra dữ liệu nhập
  if (title.length < 5) {
    showToast("Tiêu đề cần ít nhất 5 ký tự.", "error");
    return;
  }
  if (content.length < 10) {
    showToast("Nội dung cần ít nhất 10 ký tự.", "error");
    return;
  }
  if (topic === "") {
    showToast("Vui lòng nhập chủ đề.", "error");
    return;
  }
  if (media !== "" && !isValidLink(media)) {
    showToast("Link ảnh/video phải bắt đầu bằng http:// hoặc https://", "error");
    return;
  }

  // Bài của mod hoặc bài "Chỉ mình tôi" không cần duyệt
  let status = "pending";
  if (isMod(user) || scope === "onlyme") {
    status = "approved";
  }

  if (editingPostId === "") {
    // ---- Tạo bài mới ----
    db.posts.push({
      id: createId("p"),
      authorId: user.id,
      title: title,
      content: content,
      topic: topic,
      media: media,
      scope: scope,
      status: status,
      modNote: "",
      likes: [],
      dislikes: [],
      createdAt: new Date().toISOString()
    });
    saveData();
    document.getElementById("post-form").reset();
    renderPage();
    showToast(status === "pending" ? "Đã gửi bài, vui lòng chờ kiểm duyệt." : "Đã đăng bài.", "success");
  } else {
    // ---- Lưu bài đang sửa ----
    const post = findPost(editingPostId);
    post.title = title;
    post.content = content;
    post.topic = topic;
    post.media = media;
    post.scope = scope;
    post.status = status;  // sửa xong phải duyệt lại
    post.modNote = "";
    post.updatedAt = new Date().toISOString();
    saveData();
    setFlashMessage(status === "pending" ? "Đã lưu, bài viết đang chờ duyệt lại." : "Đã lưu thay đổi.");
    location.href = "index.html";
  }
}

// Mở form ở chế độ sửa bài (khi địa chỉ có dạng index.html?edit=p1)
function startEdit(postId) {
  const user = getCurrentUser();
  const post = findPost(postId);
  if (post === null || user === null || post.authorId !== user.id) {
    showToast("Bạn chỉ có thể sửa bài viết của mình.", "error");
    return;
  }

  editingPostId = postId;
  document.getElementById("form-title").textContent = "Sửa bài viết";
  document.getElementById("submit-post").textContent = "Lưu thay đổi";
  document.getElementById("cancel-edit").style.display = "inline-block";

  document.getElementById("post-title").value = post.title;
  document.getElementById("post-content").value = post.content;
  document.getElementById("post-topic").value = post.topic;
  document.getElementById("post-media").value = post.media;
  setCheckedScope(post.scope);

  // Hiện ghi chú của người kiểm duyệt nếu có
  if (post.modNote !== "") {
    const note = document.getElementById("edit-note");
    note.textContent = "Kiểm duyệt yêu cầu sửa: " + post.modNote;
    note.style.display = "block";
  }
  document.getElementById("composer").scrollIntoView();
}

function cancelEdit() {
  location.href = "index.html";
}

// ---------- CHẠY KHI MỞ TRANG ----------
document.getElementById("post-form").addEventListener("submit", submitPost);
renderPage();

// Đọc tham số "edit" trên thanh địa chỉ, ví dụ index.html?edit=p1
const params = new URLSearchParams(location.search);
if (params.get("edit") !== null) {
  startEdit(params.get("edit"));
}
