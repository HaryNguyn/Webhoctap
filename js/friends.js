// =============================================================
// FILE friends.js - TRANG BẠN BÈ (friends.html)
// -------------------------------------------------------------
// Chức năng: gửi lời mời, chấp nhận, từ chối, thu hồi lời mời,
// hủy kết bạn, tìm người dùng khác.
// Lời mời được lưu trong db.friendRequests: { fromId, toId }
// Khi chấp nhận: thêm id của nhau vào mảng friends của cả 2 người.
// =============================================================

// Trang này bắt buộc đăng nhập
const me = requireLogin();

// ---------- VẼ LẠI TRANG ----------
function renderPage() {
  if (me === null) {
    return;
  }
  renderIncoming();
  renderOutgoing();
  renderFriends();
  renderPeople();
}

// Một dòng hiển thị người dùng, "buttons" là các nút bên phải
function personHtml(person, buttons) {
  let html = '<div class="person">';
  html += avatarHtml(person.id);
  html += '<div class="person-info"><strong>' + escapeHtml(person.fullName) + "</strong>";
  html += '<span class="muted">@' + escapeHtml(person.username) + " · " + escapeHtml(person.bio) + "</span></div>";
  html += '<div class="person-buttons">' + buttons + "</div>";
  html += "</div>";
  return html;
}

// Lời mời người khác gửi cho mình
function renderIncoming() {
  let html = "";
  let count = 0;
  for (let i = 0; i < db.friendRequests.length; i++) {
    const request = db.friendRequests[i];
    if (request.toId === me.id) {
      const sender = findUser(request.fromId);
      html += personHtml(sender,
        '<button class="btn btn-small" onclick="acceptRequest(\'' + request.id + '\')">Chấp nhận</button>' +
        '<button class="btn btn-small btn-outline" onclick="declineRequest(\'' + request.id + '\')">Từ chối</button>');
      count++;
    }
  }
  document.getElementById("incoming-count").textContent = count;
  document.getElementById("incoming-list").innerHTML = count === 0 ? '<p class="muted">Không có lời mời mới.</p>' : html;
}

// Lời mời mình đã gửi
function renderOutgoing() {
  let html = "";
  let count = 0;
  for (let i = 0; i < db.friendRequests.length; i++) {
    const request = db.friendRequests[i];
    if (request.fromId === me.id) {
      const receiver = findUser(request.toId);
      html += personHtml(receiver,
        '<button class="btn btn-small btn-outline" onclick="cancelRequest(\'' + request.id + '\')">Thu hồi</button>');
      count++;
    }
  }
  document.getElementById("outgoing-count").textContent = count;
  document.getElementById("outgoing-list").innerHTML = count === 0 ? '<p class="muted">Bạn chưa gửi lời mời nào.</p>' : html;
}

// Danh sách bạn bè, kèm số bài và tài liệu bạn ấy chia sẻ mà mình xem được
function renderFriends() {
  let html = "";
  for (let i = 0; i < me.friends.length; i++) {
    const friend = findUser(me.friends[i]);
    if (friend === null) {
      continue;
    }
    let postCount = 0;
    for (let j = 0; j < db.posts.length; j++) {
      if (db.posts[j].authorId === friend.id && canView(me, db.posts[j])) {
        postCount++;
      }
    }
    let docCount = 0;
    for (let j = 0; j < db.documents.length; j++) {
      if (db.documents[j].authorId === friend.id && canView(me, db.documents[j])) {
        docCount++;
      }
    }
    html += personHtml(friend,
      '<span class="muted">' + postCount + " bài · " + docCount + " tài liệu</span>" +
      '<button class="btn btn-small btn-danger" onclick="unfriend(\'' + friend.id + '\')">Hủy kết bạn</button>');
  }
  document.getElementById("friend-count").textContent = me.friends.length;
  document.getElementById("friend-list").innerHTML = html === "" ? '<p class="muted">Bạn chưa có bạn bè nào.</p>' : html;
}

// Kiểm tra giữa 2 người đã có lời mời đang chờ chưa (theo cả 2 chiều)
function hasRequest(userA, userB) {
  for (let i = 0; i < db.friendRequests.length; i++) {
    const request = db.friendRequests[i];
    if ((request.fromId === userA && request.toId === userB) || (request.fromId === userB && request.toId === userA)) {
      return true;
    }
  }
  return false;
}

// Gợi ý người dùng khác (chưa là bạn, chưa có lời mời)
function renderPeople() {
  const keyword = document.getElementById("search-people").value.trim().toLowerCase();
  let html = "";
  for (let i = 0; i < db.users.length; i++) {
    const person = db.users[i];
    if (person.id === me.id || isFriend(me, person.id) || hasRequest(me.id, person.id)) {
      continue;
    }
    const text = (person.fullName + " " + person.username).toLowerCase();
    if (keyword !== "" && !text.includes(keyword)) {
      continue;
    }
    html += personHtml(person,
      '<button class="btn btn-small" onclick="sendRequest(\'' + person.id + '\')">Kết bạn</button>');
  }
  document.getElementById("people-list").innerHTML = html === "" ? '<p class="muted">Không tìm thấy người phù hợp.</p>' : html;
}

// ---------- CÁC HÀNH ĐỘNG ----------

// Xóa một lời mời khỏi danh sách theo id
function removeRequest(requestId) {
  const newList = [];
  for (let i = 0; i < db.friendRequests.length; i++) {
    if (db.friendRequests[i].id !== requestId) {
      newList.push(db.friendRequests[i]);
    }
  }
  db.friendRequests = newList;
}

function findRequest(requestId) {
  for (let i = 0; i < db.friendRequests.length; i++) {
    if (db.friendRequests[i].id === requestId) {
      return db.friendRequests[i];
    }
  }
  return null;
}

function sendRequest(personId) {
  if (isFriend(me, personId) || hasRequest(me.id, personId)) {
    showToast("Hai bạn đã là bạn bè hoặc đã có lời mời.", "error");
    return;
  }
  db.friendRequests.push({
    id: createId("f"),
    fromId: me.id,
    toId: personId,
    createdAt: new Date().toISOString()
  });
  saveData();
  renderPage();
  showToast("Đã gửi lời mời kết bạn.", "success");
}

function acceptRequest(requestId) {
  const request = findRequest(requestId);
  if (request === null) {
    return;
  }
  const sender = findUser(request.fromId);

  // Kết bạn 2 chiều: mỗi người thêm id của người kia
  if (!me.friends.includes(sender.id)) {
    me.friends.push(sender.id);
  }
  if (!sender.friends.includes(me.id)) {
    sender.friends.push(me.id);
  }

  removeRequest(requestId);
  saveData();
  renderPage();
  showToast("Bạn và " + sender.fullName + " đã trở thành bạn bè.", "success");
}

function declineRequest(requestId) {
  removeRequest(requestId);
  saveData();
  renderPage();
  showToast("Đã từ chối lời mời.", "success");
}

function cancelRequest(requestId) {
  removeRequest(requestId);
  saveData();
  renderPage();
  showToast("Đã thu hồi lời mời.", "success");
}

function unfriend(friendId) {
  if (!confirm("Bạn chắc chắn muốn hủy kết bạn?")) {
    return;
  }
  const friend = findUser(friendId);

  // Xóa id của nhau khỏi danh sách bạn bè của cả 2 người
  const myNewList = [];
  for (let i = 0; i < me.friends.length; i++) {
    if (me.friends[i] !== friendId) {
      myNewList.push(me.friends[i]);
    }
  }
  me.friends = myNewList;

  const friendNewList = [];
  for (let i = 0; i < friend.friends.length; i++) {
    if (friend.friends[i] !== me.id) {
      friendNewList.push(friend.friends[i]);
    }
  }
  friend.friends = friendNewList;

  saveData();
  renderPage();
  showToast("Đã hủy kết bạn.", "success");
}

// ---------- CHẠY KHI MỞ TRANG ----------
renderPage();
