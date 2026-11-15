// =============================================================
// FILE data.js - DỮ LIỆU CỦA WEBSITE
// -------------------------------------------------------------
// Website không có server, nên mọi dữ liệu được lưu trong
// localStorage của trình duyệt dưới dạng chuỗi JSON.
//  - Lần đầu mở web: chưa có dữ liệu -> dùng dữ liệu mẫu bên dưới.
//  - Các lần sau: đọc dữ liệu đã lưu trong localStorage ra dùng.
// =============================================================

// Tên "ngăn kéo" trong localStorage để cất dữ liệu
const DATA_KEY = "studyhub_data";
const LOGIN_KEY = "studyhub_current_user";

// Hàm tạo thời gian cách đây "soNgay" ngày (dùng cho dữ liệu mẫu)
function daysAgo(soNgay) {
  const time = new Date();
  time.setDate(time.getDate() - soNgay);
  return time.toISOString();
}

// Dữ liệu mẫu khi mở web lần đầu
function createSampleData() {
  return {
    // ----- Người dùng -----
    // role = "user" (người đăng bài) hoặc "mod" (người kiểm duyệt)
    users: [
      {
        id: "u1", username: "an", password: "123456", fullName: "Nguyễn Văn An",
        email: "an@gmail.com", bio: "Thích học Toán và lập trình web.", role: "user",
        friends: ["u3"], savedPosts: ["p1"], savedDocs: ["d1"], createdAt: daysAgo(30)
      },
      {
        id: "u2", username: "mod", password: "123456", fullName: "Trần Thị Mai",
        email: "mod@gmail.com", bio: "Người kiểm duyệt của StudyHub.", role: "mod",
        friends: [], savedPosts: [], savedDocs: [], createdAt: daysAgo(40)
      },
      {
        id: "u3", username: "linh", password: "123456", fullName: "Lê Thùy Linh",
        email: "linh@gmail.com", bio: "Sinh viên CNTT, đang ôn JavaScript.", role: "user",
        friends: ["u1"], savedPosts: [], savedDocs: [], createdAt: daysAgo(20)
      },
      {
        id: "u4", username: "minh", password: "123456", fullName: "Phạm Đức Minh",
        email: "minh@gmail.com", bio: "Hay chia sẻ tài liệu Sinh học.", role: "user",
        friends: [], savedPosts: [], savedDocs: [], createdAt: daysAgo(10)
      }
    ],

    // ----- Bài thảo luận -----
    // scope: "public" (công khai), "friends" (bạn bè), "onlyme" (chỉ mình tôi)
    // status: "approved" (đã duyệt), "pending" (chờ duyệt), "needs-edit" (cần sửa)
    posts: [
      {
        id: "p1", authorId: "u1", title: "Mẹo nhớ công thức tích phân từng phần?",
        content: "Mình hay nhầm dấu khi làm tích phân từng phần. Mọi người chọn u và dv theo cách nào?",
        topic: "Toán học", media: "", scope: "public", status: "approved", modNote: "",
        likes: ["u3", "u2"], dislikes: [], createdAt: daysAgo(1)
      },
      {
        id: "p2", authorId: "u2", title: "Phương pháp Pomodoro: học 25 phút, nghỉ 5 phút",
        content: "Thử chia thời gian học thành các phiên 25 phút. Sau mỗi phiên hãy ghi lại 1 điều mình vừa hiểu.",
        topic: "Kỹ năng học tập",
        media: "",
        scope: "public", status: "approved", modNote: "",
        likes: ["u1", "u3", "u4"], dislikes: [], createdAt: daysAgo(2)
      },
      {
        id: "p4", authorId: "u3", title: "Cách mình học từ vựng tiếng Anh",
        content: "Mình học từ theo ngữ cảnh bằng flashcard. Bài này chỉ chia sẻ cho bạn bè.",
        topic: "Ngoại ngữ", media: "", scope: "friends", status: "approved", modNote: "",
        likes: ["u1"], dislikes: [], createdAt: daysAgo(1)
      },
      {
        id: "p5", authorId: "u1", title: "Ý tưởng cho dự án cuối kỳ",
        content: "Mình muốn làm ứng dụng quản lý thời gian học. Mọi người góp ý giúp nhé.",
        topic: "Dự án", media: "", scope: "public", status: "needs-edit",
        modNote: "Bạn hãy ghi rõ mục tiêu và đối tượng sử dụng của dự án.",
        likes: [], dislikes: [], createdAt: daysAgo(2)
      },
      {
        id: "p6", authorId: "u4", title: "Sơ đồ ôn tập môn Sinh học",
        content: "Mình chia kiến thức thành các chủ đề nhỏ và nối chúng bằng sơ đồ tư duy.",
        topic: "Sinh học", media: "", scope: "public", status: "pending", modNote: "",
        likes: [], dislikes: [], createdAt: daysAgo(3)
      },
      {
        id: "p7", authorId: "u1", title: "Ghi chú riêng của mình",
        content: "Bài này để chế độ Chỉ mình tôi, người khác (kể cả mod) không xem được.",
        topic: "Ghi chú", media: "", scope: "onlyme", status: "approved", modNote: "",
        likes: [], dislikes: [], createdAt: daysAgo(0)
      }
    ],

    // ----- Bình luận -----
    // parentId = "" nếu là bình luận gốc, = id bình luận cha nếu là câu trả lời
    comments: [
      {
        id: "c1", postId: "p1", parentId: "", authorId: "u3",
        content: "Mình dùng quy tắc LIATE để chọn u, rất dễ nhớ.", media: "", createdAt: daysAgo(1)
      },
      {
        id: "c2", postId: "p1", parentId: "c1", authorId: "u1",
        content: "Cảm ơn bạn, mình sẽ thử ngay!", media: "", createdAt: daysAgo(0)
      },
      {
        id: "c3", postId: "p2", parentId: "", authorId: "u4",
        content: "Mình cũng dùng Pomodoro, hiệu quả lắm.", media: "", createdAt: daysAgo(1)
      }
    ],

    // ----- Tài liệu -----
    documents: [
      {
        id: "d1", authorId: "u3", name: "Tài liệu JavaScript cơ bản (MDN)",
        link: "https://developer.mozilla.org/vi/docs/Web/JavaScript", subject: "Lập trình",
        description: "Tài liệu chính thức về cú pháp, biến, hàm của JavaScript.",
        scope: "public", status: "approved", modNote: "", likes: ["u1", "u2"], dislikes: [], createdAt: daysAgo(2)
      },
      {
        id: "d2", authorId: "u1", name: "Giáo trình Giải tích (OpenStax)",
        link: "https://openstax.org/subjects/math", subject: "Toán học",
        description: "Sách miễn phí về giải tích, có nhiều bài tập.",
        scope: "public", status: "approved", modNote: "", likes: ["u3"], dislikes: [], createdAt: daysAgo(3)
      },
      {
        id: "d3", authorId: "u4", name: "Đề cương ôn tập Sinh học",
        link: "https://openstax.org/subjects/science", subject: "Sinh học",
        description: "Tổng hợp link tham khảo cho buổi ôn tập.",
        scope: "public", status: "pending", modNote: "", likes: [], dislikes: [], createdAt: daysAgo(4)
      },
      {
        id: "d4", authorId: "u3", name: "Học tiếng Anh với British Council",
        link: "https://learnenglish.britishcouncil.org/", subject: "Ngoại ngữ",
        description: "Trang học tiếng Anh miễn phí, chỉ chia sẻ cho bạn bè.",
        scope: "friends", status: "approved", modNote: "", likes: ["u1"], dislikes: [], createdAt: daysAgo(1)
      }
    ],

    // ----- Lời mời kết bạn đang chờ -----
    friendRequests: [
      { id: "f1", fromId: "u4", toId: "u1", createdAt: daysAgo(1) }
    ],

    // ----- Báo cáo nội dung -----
    // type: "post" hoặc "document"; status: "open" (chưa xử lý) hoặc "done" (đã xử lý)
    reports: [
      {
        id: "r1", type: "post", targetId: "p6", reporterId: "u1",
        reason: "Nội dung chưa ghi nguồn tham khảo.", status: "open", createdAt: daysAgo(2)
      }
    ]
  };
}

// Biến toàn cục chứa toàn bộ dữ liệu, các file JS khác đều dùng biến này
let db = loadData();

// Đọc dữ liệu từ localStorage
function loadData() {
  const text = localStorage.getItem(DATA_KEY);
  if (text === null) {
    // Chưa có dữ liệu -> tạo dữ liệu mẫu và lưu lại
    const sample = createSampleData();
    localStorage.setItem(DATA_KEY, JSON.stringify(sample));
    return sample;
  }
  return JSON.parse(text);
}

// Ghi dữ liệu vào localStorage (gọi sau mỗi lần thay đổi dữ liệu)
function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(db));
}

// Tạo id mới không trùng, ví dụ: "p1718000000000"
function createId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}
