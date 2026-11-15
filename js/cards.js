// =============================================================
// FILE cards.js - THẺ BÀI VIẾT, THẺ TÀI LIỆU VÀ CÁC NÚT TƯƠNG TÁC
// -------------------------------------------------------------
// Dùng chung cho trang Thảo luận, Tài liệu và Cá nhân.
// Mỗi trang phải tự viết hàm renderPage() để vẽ lại trang
// sau khi người dùng bấm Thích, Lưu, Bình luận, ...
// =============================================================

// Id của bình luận đang được trả lời (để hiện ô trả lời bên dưới nó)
let replyingCommentId = "";

// ---------- 1. TÌM BÀI VIẾT / TÀI LIỆU ----------

function findPost(postId) {
  for (let i = 0; i < db.posts.length; i++) {
    if (db.posts[i].id === postId) {
      return db.posts[i];
    }
  }
  return null;
}

function findDocument(docId) {
  for (let i = 0; i < db.documents.length; i++) {
    if (db.documents[i].id === docId) {
      return db.documents[i];
    }
  }
  return null;
}

// type = "post" thì tìm bài viết, type = "document" thì tìm tài liệu
function findItem(type, id) {
  if (type === "post") {
    return findPost(id);
  }
  return findDocument(id);
}

// Lấy danh sách bình luận của một bài viết
function getComments(postId) {
  const result = [];
  for (let i = 0; i < db.comments.length; i++) {
    if (db.comments[i].postId === postId) {
      result.push(db.comments[i]);
    }
  }
  return result;
}

// ---------- 2. THẺ BÀI VIẾT ----------

function postCardHtml(post) {
  const user = getCurrentUser();
  const isOwner = user !== null && user.id === post.authorId;
  const comments = getComments(post.id);

  // Kiểm tra người dùng đã thích / không thích / lưu bài này chưa
  let liked = false;
  let disliked = false;
  let saved = false;
  if (user !== null) {
    liked = post.likes.includes(user.id);
    disliked = post.dislikes.includes(user.id);
    saved = user.savedPosts.includes(post.id);
  }

  let html = '<article class="card post-card">';

  // Phần đầu: tác giả, thời gian, phạm vi, trạng thái
  html += '<div class="card-head">';
  html += '<div class="author">' + avatarHtml(post.authorId) + "<div>";
  html += "<strong>" + escapeHtml(getUserName(post.authorId)) + "</strong>";
  html += '<span class="muted">' + formatDate(post.createdAt) + "</span>";
  html += "</div></div>";
  html += '<div class="badges">' + scopeBadge(post.scope);
  if (isOwner || isMod(user)) {
    html += statusBadge(post.status);
  }
  html += "</div></div>";

  // Nội dung bài viết
  html += '<span class="topic">' + escapeHtml(post.topic) + "</span>";
  html += "<h3>" + escapeHtml(post.title) + "</h3>";
  html += '<p class="post-content">' + escapeHtml(post.content) + "</p>";
  html += mediaHtml(post.media);

  // Ghi chú của người kiểm duyệt (chỉ tác giả thấy)
  if (isOwner && post.modNote !== "") {
    html += '<p class="mod-note"><b>Kiểm duyệt yêu cầu sửa:</b> ' + escapeHtml(post.modNote) + "</p>";
  }

  // Các nút tương tác
  html += '<div class="actions">';
  html += '<button class="action' + (liked ? " active" : "") + '" onclick="toggleReaction(\'post\', \'' + post.id + '\', \'like\')">👍 Thích (' + post.likes.length + ")</button>";
  html += '<button class="action' + (disliked ? " active" : "") + '" onclick="toggleReaction(\'post\', \'' + post.id + '\', \'dislike\')">👎 Không thích (' + post.dislikes.length + ")</button>";
  html += '<button class="action' + (saved ? " active" : "") + '" onclick="toggleSave(\'post\', \'' + post.id + '\')">' + (saved ? "★ Đã lưu" : "☆ Lưu") + "</button>";
  if (isOwner) {
    html += '<a class="action" href="index.html?edit=' + post.id + '">✏️ Sửa</a>';
    html += '<button class="action action-danger" onclick="deleteContent(\'post\', \'' + post.id + '\')">🗑 Xóa</button>';
  } else {
    html += '<button class="action" onclick="reportContent(\'post\', \'' + post.id + '\')">🚩 Báo cáo</button>';
  }
  html += "</div>";

  // Phần bình luận
  html += '<div class="comments">';
  html += "<h4>Bình luận (" + comments.length + ")</h4>";
  html += commentsHtml(post.id, comments);
  if (user === null) {
    html += '<p class="muted"><a href="login.html">Đăng nhập</a> để bình luận.</p>';
  } else {
    html += commentFormHtml(post.id, "");
  }
  html += "</div>";

  html += "</article>";
  return html;
}

// Danh sách bình luận: bình luận gốc và các câu trả lời bên dưới
function commentsHtml(postId, comments) {
  const user = getCurrentUser();
  let html = "";

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment.parentId !== "") {
      continue; // bỏ qua câu trả lời, sẽ vẽ bên dưới bình luận cha
    }
    html += '<div class="comment">';
    html += oneCommentHtml(comment);

    // Nút trả lời
    if (user !== null) {
      html += '<button class="link-button" onclick="showReplyForm(\'' + comment.id + '\')">↩ Trả lời</button>';
    }

    // Các câu trả lời của bình luận này
    html += '<div class="replies">';
    for (let j = 0; j < comments.length; j++) {
      if (comments[j].parentId === comment.id) {
        html += '<div class="comment">' + oneCommentHtml(comments[j]) + "</div>";
      }
    }
    // Ô nhập câu trả lời (chỉ hiện khi bấm "Trả lời")
    if (replyingCommentId === comment.id) {
      html += commentFormHtml(postId, comment.id);
    }
    html += "</div>";

    html += "</div>";
  }
  return html;
}

// Nội dung của một bình luận
function oneCommentHtml(comment) {
  let html = '<div class="comment-head">' + avatarHtml(comment.authorId);
  html += "<strong>" + escapeHtml(getUserName(comment.authorId)) + "</strong>";
  html += '<span class="muted">' + formatDate(comment.createdAt) + "</span></div>";
  html += "<p>" + escapeHtml(comment.content) + "</p>";
  html += mediaHtml(comment.media);
  return html;
}

// Form gửi bình luận (parentId = "" là bình luận mới, khác "" là trả lời)
function commentFormHtml(postId, parentId) {
  const key = parentId === "" ? postId : parentId;
  let html = '<form class="comment-form" onsubmit="submitComment(event, \'' + postId + '\', \'' + parentId + '\')">';
  html += '<input id="comment-text-' + key + '" placeholder="' + (parentId === "" ? "Viết bình luận..." : "Viết câu trả lời...") + '" required>';
  html += '<input id="comment-media-' + key + '" type="url" placeholder="Link ảnh/video (không bắt buộc)">';
  html += '<button class="btn btn-small" type="submit">Gửi</button>';
  html += "</form>";
  return html;
}

// ---------- 3. THẺ TÀI LIỆU ----------

function documentCardHtml(doc) {
  const user = getCurrentUser();
  const isOwner = user !== null && user.id === doc.authorId;

  let liked = false;
  let disliked = false;
  let saved = false;
  if (user !== null) {
    liked = doc.likes.includes(user.id);
    disliked = doc.dislikes.includes(user.id);
    saved = user.savedDocs.includes(doc.id);
  }

  let html = '<article class="card doc-card">';
  html += '<div class="doc-icon">📄</div>';
  html += '<div class="doc-body">';

  html += '<div class="card-head"><h3>' + escapeHtml(doc.name) + "</h3>";
  html += '<div class="badges">' + scopeBadge(doc.scope);
  if (isOwner || isMod(user)) {
    html += statusBadge(doc.status);
  }
  html += "</div></div>";

  html += "<p>" + escapeHtml(doc.description) + "</p>";
  html += '<p class="muted">Môn: <b>' + escapeHtml(doc.subject) + "</b> · Chia sẻ bởi "
    + escapeHtml(getUserName(doc.authorId)) + " · " + formatDate(doc.createdAt) + "</p>";

  if (isOwner && doc.modNote !== "") {
    html += '<p class="mod-note"><b>Kiểm duyệt yêu cầu sửa:</b> ' + escapeHtml(doc.modNote) + "</p>";
  }

  html += '<div class="actions">';
  html += '<a class="btn btn-small" href="' + escapeHtml(doc.link) + '" target="_blank">Mở tài liệu ↗</a>';
  html += '<button class="action' + (liked ? " active" : "") + '" onclick="toggleReaction(\'document\', \'' + doc.id + '\', \'like\')">👍 ' + doc.likes.length + "</button>";
  html += '<button class="action' + (disliked ? " active" : "") + '" onclick="toggleReaction(\'document\', \'' + doc.id + '\', \'dislike\')">👎 ' + doc.dislikes.length + "</button>";
  html += '<button class="action' + (saved ? " active" : "") + '" onclick="toggleSave(\'document\', \'' + doc.id + '\')">' + (saved ? "★ Đã lưu" : "☆ Lưu") + "</button>";
  if (isOwner) {
    html += '<a class="action" href="documents.html?edit=' + doc.id + '">✏️ Sửa</a>';
    html += '<button class="action action-danger" onclick="deleteContent(\'document\', \'' + doc.id + '\')">🗑 Xóa</button>';
  } else {
    html += '<button class="action" onclick="reportContent(\'document\', \'' + doc.id + '\')">🚩 Báo cáo</button>';
  }
  html += "</div>";

  html += "</div></article>";
  return html;
}

// ---------- 4. CÁC HÀNH ĐỘNG KHI BẤM NÚT ----------

// Thích / Không thích (bấm lần nữa để bỏ)
function toggleReaction(type, id, reaction) {
  const user = getCurrentUser();
  if (user === null) {
    showToast("Hãy đăng nhập để bày tỏ cảm xúc.", "error");
    return;
  }
  const item = findItem(type, id);

  // Kiểm tra xem trước đó đã chọn cái này chưa
  let wasChosen;
  if (reaction === "like") {
    wasChosen = item.likes.includes(user.id);
  } else {
    wasChosen = item.dislikes.includes(user.id);
  }

  // Xóa người dùng khỏi cả 2 danh sách thích và không thích
  item.likes = removeFromList(item.likes, user.id);
  item.dislikes = removeFromList(item.dislikes, user.id);

  // Nếu trước đó chưa chọn thì thêm vào danh sách vừa chọn
  if (!wasChosen) {
    if (reaction === "like") {
      item.likes.push(user.id);
    } else {
      item.dislikes.push(user.id);
    }
  }

  saveData();
  renderPage();
}

// Trả về danh sách mới đã bỏ đi phần tử "value"
function removeFromList(list, value) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i] !== value) {
      result.push(list[i]);
    }
  }
  return result;
}

// Lưu / Bỏ lưu bài viết hoặc tài liệu
function toggleSave(type, id) {
  const user = getCurrentUser();
  if (user === null) {
    showToast("Hãy đăng nhập để lưu nội dung.", "error");
    return;
  }

  let message;
  if (type === "post") {
    if (user.savedPosts.includes(id)) {
      user.savedPosts = removeFromList(user.savedPosts, id);
      message = "Đã bỏ lưu bài viết.";
    } else {
      user.savedPosts.push(id);
      message = "Đã lưu bài viết.";
    }
  } else {
    if (user.savedDocs.includes(id)) {
      user.savedDocs = removeFromList(user.savedDocs, id);
      message = "Đã bỏ lưu tài liệu.";
    } else {
      user.savedDocs.push(id);
      message = "Đã lưu tài liệu.";
    }
  }

  saveData();
  renderPage();
  showToast(message, "success");
}

// Báo cáo nội dung không phù hợp
function reportContent(type, id) {
  const user = getCurrentUser();
  if (user === null) {
    showToast("Hãy đăng nhập để báo cáo nội dung.", "error");
    return;
  }

  // Mỗi người chỉ báo cáo 1 nội dung 1 lần (khi báo cáo cũ chưa xử lý)
  for (let i = 0; i < db.reports.length; i++) {
    const report = db.reports[i];
    if (report.targetId === id && report.reporterId === user.id && report.status === "open") {
      showToast("Bạn đã báo cáo nội dung này rồi.", "error");
      return;
    }
  }

  const reason = prompt("Lý do báo cáo nội dung này là gì?");
  if (reason === null) {
    return; // người dùng bấm Hủy
  }
  if (reason.trim().length < 5) {
    showToast("Vui lòng ghi lý do cụ thể hơn (ít nhất 5 ký tự).", "error");
    return;
  }

  db.reports.push({
    id: createId("r"),
    type: type,
    targetId: id,
    reporterId: user.id,
    reason: reason.trim(),
    status: "open",
    createdAt: new Date().toISOString()
  });
  saveData();
  showToast("Đã gửi báo cáo. Người kiểm duyệt sẽ xem xét.", "success");
}

// Xóa bài viết hoặc tài liệu (tác giả xóa bài của mình, mod xóa khi kiểm duyệt)
function deleteContent(type, id) {
  const user = getCurrentUser();
  const item = findItem(type, id);
  if (item === null || user === null) {
    return;
  }
  const isOwner = user.id === item.authorId;
  if (!isOwner && !isMod(user)) {
    showToast("Bạn không có quyền xóa nội dung này.", "error");
    return;
  }
  if (!confirm("Bạn chắc chắn muốn xóa? Không thể khôi phục.")) {
    return;
  }

  removeContent(type, id);
  renderPage();
  showToast("Đã xóa nội dung.", "success");
}

// Gỡ hẳn nội dung khỏi dữ liệu cùng mọi thứ liên quan
function removeContent(type, id) {
  if (type === "post") {
    // Xóa bài viết
    const newPosts = [];
    for (let i = 0; i < db.posts.length; i++) {
      if (db.posts[i].id !== id) {
        newPosts.push(db.posts[i]);
      }
    }
    db.posts = newPosts;

    // Xóa các bình luận của bài viết
    const newComments = [];
    for (let i = 0; i < db.comments.length; i++) {
      if (db.comments[i].postId !== id) {
        newComments.push(db.comments[i]);
      }
    }
    db.comments = newComments;
  } else {
    const newDocs = [];
    for (let i = 0; i < db.documents.length; i++) {
      if (db.documents[i].id !== id) {
        newDocs.push(db.documents[i]);
      }
    }
    db.documents = newDocs;
  }

  // Bỏ nội dung khỏi danh sách đã lưu của mọi người
  for (let i = 0; i < db.users.length; i++) {
    db.users[i].savedPosts = removeFromList(db.users[i].savedPosts, id);
    db.users[i].savedDocs = removeFromList(db.users[i].savedDocs, id);
  }

  // Đóng các báo cáo về nội dung này
  for (let i = 0; i < db.reports.length; i++) {
    if (db.reports[i].targetId === id && db.reports[i].status === "open") {
      db.reports[i].status = "done";
      db.reports[i].result = "Đã gỡ nội dung";
    }
  }

  saveData();
}

// Hiện / ẩn ô trả lời bình luận
function showReplyForm(commentId) {
  if (replyingCommentId === commentId) {
    replyingCommentId = "";
  } else {
    replyingCommentId = commentId;
  }
  renderPage();
}

// Gửi bình luận hoặc câu trả lời
function submitComment(event, postId, parentId) {
  event.preventDefault(); // chặn form tải lại trang
  const user = getCurrentUser();
  if (user === null) {
    return;
  }

  const key = parentId === "" ? postId : parentId;
  const content = document.getElementById("comment-text-" + key).value.trim();
  const media = document.getElementById("comment-media-" + key).value.trim();

  if (content === "") {
    showToast("Bạn chưa nhập nội dung bình luận.", "error");
    return;
  }
  if (media !== "" && !isValidLink(media)) {
    showToast("Link ảnh/video phải bắt đầu bằng http:// hoặc https://", "error");
    return;
  }

  db.comments.push({
    id: createId("c"),
    postId: postId,
    parentId: parentId,
    authorId: user.id,
    content: content,
    media: media,
    createdAt: new Date().toISOString()
  });
  saveData();

  replyingCommentId = "";
  renderPage();
  showToast(parentId === "" ? "Đã gửi bình luận." : "Đã gửi câu trả lời.", "success");
}
