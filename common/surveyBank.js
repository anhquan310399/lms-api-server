const questions = [
    {
        "identity": "0",
        "question": "Mức độ của nội dung video, slide, tài liệu tham khảo của giáo viên cung cấp?",
        "typeQuestion": "choice",
        "answer": [
            "Đầy đủ và rất tốt", "Đầy đủ và tốt", "Bình thường", "Không đầy đủ"
        ]
    },
    {
        "identity": "1",
        "question": "SV đã đọc trước slide bài giảng/ bài tập/ bài LAB ở mức nào trước buổi học online",
        "typeQuestion": "choice",
        "answer": [
            "Đọc 100% ", "Đọc 70%", "Đọc 50% ", "Không đọc "
        ]
    },
    {
        "identity": "2",
        "question": "Nội dung trong buổi học online, SV muốn GV cần tập trung gì? (chọn 2)",
        "typeQuestion": "multiple",
        "answer": [
            "Chỉ giảng chi tiết lý thuyết, Bài tập tự làm",
            "Review lại lý thuyết sau khi SV đọc slide ở nhà",
            "Chỉ giải đáp khi SV thắc mắc",
            "SV báo cáo bài tập/LAB và GV sửa bài chung cho cả lớp"
        ]
    }
    ,
    {
        "identity": "3",
        "question": "Bạn có đề xuất gì để việc giảng dạy online được tốt hơn? ",
        "typeQuestion": "fill"
    }
]


module.exports = questions;