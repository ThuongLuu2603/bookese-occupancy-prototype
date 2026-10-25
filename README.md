# Bookese — Phòng, khách và phụ thu

Prototype độc lập, tái hiện khung giao diện Extranet và Bookese từ trang tham chiếu ngày 25/10/2026. Không kết nối hoặc thay đổi hệ thống thật.

## Mở và chạy

- `npm start` → http://127.0.0.1:4178
- `npm test` kiểm tra phân bổ khách, giới hạn, tuổi, tồn phòng và phụ thu.
- Extranet: `#/extranet/policy`; loại phòng `#/extranet/rooms`; lịch giá `#/extranet/calendar`.
- Khách hàng: `#/customer/home`, `#/customer/results`, `#/customer/hotel`.

## Phạm vi

Chính sách và giới hạn sửa được, lưu localStorage và đồng bộ giữa tab cùng origin. Search tìm tổ hợp đủ khách trong đúng số phòng. Chọn nhiều loại phòng cùng gói giá; khách/giường và phụ thu nằm trong bảng Phòng trống, phần chỉnh sửa chỉ mở khi cần. Không có khối sắp xếp khách riêng. Đơn mô phỏng lưu bản chụp chính sách/giá trong phiên, hiển thị lại ở Extranet.

Giá cơ bản/inventory mẫu áp dụng đồng nhất mọi đêm. Không có tích hợp API thật, kho giường dùng chung, khuyến mãi, thanh toán hoặc gửi email. Ngoài luồng này các menu giữ làm giao diện tham chiếu. Prototype hỗ trợ tối đa 6 phòng, 24 người lớn, 8 trẻ, 30 đêm.

## Giả định cần đối tác chốt

- Phụ thu người thêm dùng giường có sẵn: 150.000đ/người/đêm (minh họa mới, sửa được).
- Giường phụ: 200.000đ cho Awaken/alo ha, 300.000đ cho Leo Truong; mặc định đã gồm phụ thu người sử dụng (sửa được thành cộng riêng).
- Chỗ thêm dùng giường có sẵn tự tính: sức chứa tối đa − khách tiêu chuẩn − giường phụ đang bật. Awaken 0, alo ha 2, Leo Truong 0 với cấu hình mặc định; không nhập riêng. Giường phụ không được vượt phần sức chứa còn lại.
- Tổng sức chứa là giới hạn cứng, đã gồm giường phụ. Khách tiêu chuẩn + chỗ thêm + giường phụ là khả năng bố trí, không tự tăng giới hạn tổng.
- Cận trên tuổi hiển thị dạng 12.99 nếu mốc người lớn là 13; logic so sánh tuổi < 13, không bỏ sót khoảng giữa 12.99 và 13. Giữ tuổi thực trẻ, tính tiền theo tuổi ở chính sách. Giá tiêu chuẩn bao gồm tối đa 2 khách tính giá người lớn; trẻ nhỏ tính riêng ngay cả khi còn suất tiêu chuẩn.
- Luôn áp dụng giường phụ trước cho khách vượt số tiêu chuẩn, kể cả trẻ em. Sau khi dùng hết giường phụ mới dùng chỗ thêm giường có sẵn; không có tùy chọn tắt ưu tiên hoặc trạng thái chờ xác nhận giường.
- Hình khách sạn và logo được lấy từ trang Bookese do người dùng cung cấp để tái hiện giao diện.

Cấu hình v1/v2 được chuyển sang v3 khi đọc: giữ mốc tuổi/phụ thu đã lưu, bỏ các trường cũ; giá alo ha mặc định 700.000đ được nâng lên 800.000đ theo yêu cầu. Giá alo ha đã tùy chỉnh khác 700.000đ được giữ. Thêm gói Linh hoạt và Phòng Gia đình.

## Gói giá và đề xuất (v3)

| Loại phòng | Tiết kiệm | Linh hoạt | Inventory dùng chung |
| --- | ---: | ---: | ---: |
| Awaken Da Nang Hotel | 700.000đ | 850.000đ | 12 |
| alo ha | 800.000đ | 950.000đ | 1 |
| Phòng Gia đình | 1.500.000đ | 1.700.000đ | 2 |

Giá tính cho một phòng/một đêm, chưa gồm khách thêm. Tiết kiệm không hoàn hủy, thanh toán trước. Linh hoạt hủy miễn phí trước ngày nhận phòng 3 ngày, thanh toán tại chỗ nghỉ. Hai gói cùng có bữa sáng. Điều kiện mô phỏng, không phải hợp đồng với khách sạn.

Một booking chỉ dùng một gói giá — quy tắc Bookese do người dùng yêu cầu, không khẳng định là hạn chế chung của Booking.com. Mỗi room type dùng chung tồn phòng giữa các gói; không nhân đôi inventory. Đổi gói giữ các phòng/khách đã chọn khi vẫn hợp lệ. Gói giá được giữ trong báo giá, checkout và bản chụp đơn Extranet.

- Luôn giữ đúng số phòng khách tìm. Tìm 1 phòng: xét đủ tổng khách/người lớn/trẻ; ưu tiên phần sức chứa dư ít nhất, sau đó người lớn dư ít nhất, rồi giá thấp hơn. Vì vậy không gắn nhãn “rẻ nhất” cho gợi ý một phòng.
- Tìm nhiều phòng: so sánh tổng giá của mọi tổ hợp cùng gói, kể cả một loại × nhiều phòng và nhiều loại khác nhau. Tổng đã gồm các đêm và phụ thu; đồng giá ưu tiên sức chứa dư ít hơn rồi ít loại phòng hơn.
- Quy hoạch động xét toàn bộ số người lớn và tập trẻ ở từng phòng để tìm phân bổ có tổng phí thấp nhất trong mỗi tổ hợp. Không dừng ở phân bổ hợp lệ đầu tiên.
- Mẫu 5 người lớn/2 phòng/1 đêm: Awaken × 2 gói Tiết kiệm = 1.600.000đ; Awaken + alo ha = 1.700.000đ; gói Linh hoạt tương ứng 1.900.000đ và 2.000.000đ. Mẫu 5 người lớn/1 phòng: Phòng Gia đình + 1 giường phụ = 1.700.000đ.
- Tham chiếu: Booking.com Demand API mô tả multi-room booking với product/rate selection riêng theo phòng: https://developers.booking.com/demand/docs/migration-guide/v3/migration-faqs
