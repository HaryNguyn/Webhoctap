// =============================================================
// FILE auth.js - ĐĂNG NHẬP (login.html) VÀ ĐĂNG KÝ (register.html)
// -------------------------------------------------------------
// Cả 2 trang dùng chung file này. File kiểm tra xem trang đang có
// form nào (login-form hay register-form) để gắn sự kiện tương ứng.
// Đăng nhập thành công = lưu id người dùng vào localStorage (LOGIN_KEY).
// =============================================================

// Nếu đã đăng nhập rồi thì không cần vào trang này nữa
if (getCurrentUser() !== null) {
  location.href = "index.html";
}

// Hiện lỗi ngay trên form
function showError(message) {
  document.getElementById("error-message").textContent = message;
}

// ---------- ĐĂNG NHẬP ----------
function login(event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  if (username === "" || password === "") {
    showError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
    return;
  }

  // Tìm người dùng có tên đăng nhập và mật khẩu khớp
  for (let i = 0; i < db.users.length; i++) {
    const user = db.users[i];
    if (user.username === username && user.password === password) {
      localStorage.setItem(LOGIN_KEY, user.id);
      setFlashMessage("Xin chào " + user.fullName + "!");
      location.href = "index.html";
      return;
    }
  }
  showError("Tên đăng nhập hoặc mật khẩu không đúng.");
}

// Hiện / ẩn mật khẩu bằng cách đổi type của ô nhập
function toggleShowPassword() {
  const input = document.getElementById("login-password");
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

// ---------- ĐĂNG KÝ ----------
function register(event) {
  event.preventDefault();
  const username = document.getElementById("reg-username").value.trim().toLowerCase();
  const fullName = document.getElementById("reg-fullname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirmPassword = document.getElementById("reg-confirm").value;
  const agree = document.getElementById("agree").checked;

  // Biểu thức chính quy: chỉ cho phép chữ a-z, số 0-9 và dấu _, dài 3-20 ký tự
  const usernamePattern = /^[a-z0-9_]{3,20}$/;

  if (!usernamePattern.test(username)) {
    showError("Tên đăng nhập dài 3-20 ký tự, chỉ gồm chữ không dấu, số và dấu _.");
    return;
  }
  if (fullName.length < 2) {
    showError("Vui lòng nhập họ và tên.");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    showError("Email không hợp lệ.");
    return;
  }
  if (password.length < 6) {
    showError("Mật khẩu cần ít nhất 6 ký tự.");
    return;
  }
  if (password !== confirmPassword) {
    showError("Nhập lại mật khẩu không khớp.");
    return;
  }
  if (!agree) {
    showError("Bạn cần đồng ý với quy tắc cộng đồng.");
    return;
  }

  // Kiểm tra trùng tên đăng nhập hoặc email
  for (let i = 0; i < db.users.length; i++) {
    if (db.users[i].username === username) {
      showError("Tên đăng nhập đã có người sử dụng.");
      return;
    }
    if (db.users[i].email.toLowerCase() === email.toLowerCase()) {
      showError("Email đã có người sử dụng.");
      return;
    }
  }

  // Tạo tài khoản mới (người đăng ký luôn là "user", không phải mod)
  const newUser = {
    id: createId("u"),
    username: username,
    password: password,
    fullName: fullName,
    email: email,
    bio: "",
    role: "user",
    friends: [],
    savedPosts: [],
    savedDocs: [],
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveData();

  // Đăng ký xong thì đăng nhập luôn
  localStorage.setItem(LOGIN_KEY, newUser.id);
  setFlashMessage("Đăng ký thành công! Chào mừng " + fullName + ".");
  location.href = "index.html";
}

// ---------- GẮN SỰ KIỆN CHO FORM CÓ TRÊN TRANG ----------
const loginForm = document.getElementById("login-form");
if (loginForm !== null) {
  loginForm.addEventListener("submit", login);
}

const registerForm = document.getElementById("register-form");
if (registerForm !== null) {
  registerForm.addEventListener("submit", register);
}
