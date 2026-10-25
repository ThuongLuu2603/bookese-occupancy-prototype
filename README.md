# Bookese — Phòng, khách và phụ thu

Prototype độc lập, tái hiện khung giao diện Extranet và Bookese từ trang tham chiếu ngày 25/10/2026. Không kết nối hoặc thay đổi hệ thống thật.

## Mở và chạy

- `npm start` → http://127.0.0.1:4178
- `npm test` kiểm tra phân bổ khách, giới hạn, tuổi, tồn phòng và phụ thu.
- Extranet: `#/extranet/policy`; loại phòng `#/extranet/rooms`; lịch giá `#/extranet/calendar`.
- Khách hàng: `#/customer/home`, `#/customer/results`, `#/customer/hotel`.

## Phạm vi

Chính sách và giới hạn sửa được, lưu localStorage và đồng bộ giữa tab cùng origin. Search tìm tổ hợp đủ khách trong đúng số phòng. Chọn nhiều loại phòng, chuyển từng khách/trẻ, chọn giường theo khách và kiểm tra trước khi đặt thử. Đơn mô phỏng lưu bản chụp chính sách/giá trong phiên, hiển thị lại ở Extranet.

Giá cơ bản/inventory mẫu áp dụng đồng nhất mọi đêm. Không có tích hợp API thật, kho giường dùng chung, khuyến mãi, thanh toán hoặc gửi email. Ngoài luồng này các menu giữ làm giao diện tham chiếu. Prototype hỗ trợ tối đa 6 phòng, 24 người lớn, 8 trẻ, 30 đêm.

## Giả định cần đối tác chốt

- Phụ thu người thêm dùng giường có sẵn: 150.000đ/người/đêm (minh họa mới, sửa được).
- Giường phụ: 200.000đ cho Awaken/alo ha, 300.000đ cho Leo Truong; mặc định đã gồm phụ thu người sử dụng (sửa được thành cộng riêng).
- Chỗ thêm dùng giường có sẵn: Awaken 1, alo ha 2, Leo Truong 0 (minh họa mới, sửa được).
- Tổng sức chứa là giới hạn cứng, đã gồm giường phụ. Khách tiêu chuẩn + chỗ thêm + giường phụ là khả năng bố trí, không tự tăng giới hạn tổng.
- Giữ tuổi thực trẻ, tính tiền theo tuổi ở chính sách. Giá tiêu chuẩn bao gồm tối đa 2 khách tính giá người lớn; trẻ nhỏ tính riêng ngay cả khi còn suất tiêu chuẩn.
- Ưu tiên giường phụ là gợi ý cho khách vượt suất tiêu chuẩn, có thể đổi nếu còn chỗ dùng giường có sẵn.
- Hình khách sạn và logo được lấy từ trang Bookese do người dùng cung cấp để tái hiện giao diện.
