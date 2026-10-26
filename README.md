# Bookese — Phòng, khách và phụ thu

Prototype độc lập, tái hiện khung giao diện Extranet và Bookese từ trang tham chiếu ngày 25/10/2026. Không kết nối hoặc thay đổi hệ thống thật.

## Mở và chạy

- `npm start` → http://127.0.0.1:4178
- `npm test` kiểm tra phân bổ khách, giới hạn, tuổi, tồn phòng và phụ thu.
- Extranet: `#/extranet/policy`; loại phòng `#/extranet/rooms`; lịch giá `#/extranet/calendar`.
- Khách hàng: `#/customer/home`, `#/customer/results`, `#/customer/hotel`.

## Phạm vi

Chính sách và giới hạn sửa được, lưu localStorage và đồng bộ giữa tab cùng origin. Cả hai phương án tìm tổ hợp đủ khách từ 1 đến số phòng tìm kiếm; khách được chọn ít hoặc nhiều phòng hơn nếu hợp lệ. Chọn nhiều loại phòng cùng gói giá; khách/giường và phụ thu nằm trong bảng Phòng trống, phần chỉnh sửa chỉ mở khi cần. Không có khối sắp xếp khách riêng. Đơn mô phỏng lưu bản chụp chính sách/giá trong phiên, hiển thị lại ở Extranet.

Giá cơ bản/inventory mẫu áp dụng đồng nhất mọi đêm. Không có tích hợp API thật, kho giường dùng chung, khuyến mãi, thanh toán hoặc gửi email. Ngoài luồng này các menu giữ làm giao diện tham chiếu. Prototype hỗ trợ tối đa 6 phòng, 24 người lớn, 8 trẻ, 30 đêm.

## Giả định cần đối tác chốt

- Phụ thu người thêm dùng giường có sẵn: 150.000đ/người/đêm (minh họa mới, sửa được).
- Giường phụ: 200.000đ cho Awaken/alo ha, 300.000đ cho Leo Truong; mặc định đã gồm phụ thu người sử dụng (sửa được thành cộng riêng).
- Chỗ thêm dùng giường có sẵn tự tính: sức chứa tối đa − khách tiêu chuẩn − giường phụ đang bật. Awaken 0, alo ha 2, Leo Truong 0 với cấu hình mặc định; không nhập riêng. Giường phụ không được vượt phần sức chứa còn lại.
- Tổng sức chứa là giới hạn cứng, đã gồm giường phụ. Khách tiêu chuẩn + chỗ thêm + giường phụ là khả năng bố trí, không tự tăng giới hạn tổng.
- Cận trên tuổi hiển thị dạng 12.99 nếu mốc người lớn là 13; logic so sánh tuổi < 13, không bỏ sót khoảng giữa 12.99 và 13. Giữ tuổi thực trẻ, tính tiền theo tuổi ở chính sách. Suất tiêu chuẩn bao gồm người lớn và trẻ em: ưu tiên khách tính giá người lớn, trẻ nhỏ dùng suất còn trống không phụ thu.
- Luôn áp dụng giường phụ trước cho khách tính giá người lớn vượt số tiêu chuẩn. Trẻ dưới mốc giá người lớn dùng giường có sẵn, phụ thu theo tuổi khi hết suất tiêu chuẩn. Sau khi dùng hết giường phụ mới dùng chỗ thêm giường có sẵn; không có tùy chọn tắt ưu tiên hoặc trạng thái chờ xác nhận giường.
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

- Tìm 1 phòng: xét đủ tổng khách/người lớn/trẻ; ưu tiên phần sức chứa dư ít nhất, sau đó người lớn dư ít nhất, rồi giá thấp hơn. Vì vậy không gắn nhãn “rẻ nhất” cho gợi ý một phòng.
- Tìm nhiều phòng: so sánh tổng giá của mọi tổ hợp cùng gói, kể cả một loại × nhiều phòng và nhiều loại khác nhau. Tổng đã gồm các đêm và phụ thu; đồng giá ưu tiên sức chứa dư ít hơn rồi ít loại phòng hơn.
- Quy hoạch động xét toàn bộ số người lớn và tập trẻ ở từng phòng để tìm phân bổ có tổng phí thấp nhất trong mỗi tổ hợp. Không dừng ở phân bổ hợp lệ đầu tiên.
- Mẫu 5 người lớn/2 phòng/1 đêm: Awaken × 2 gói Tiết kiệm = 1.600.000đ; Awaken + alo ha = 1.700.000đ; gói Linh hoạt tương ứng 1.900.000đ và 2.000.000đ. Mẫu 5 người lớn/1 phòng: Phòng Gia đình + 1 giường phụ = 1.700.000đ.
- Tham chiếu: Booking.com Demand API mô tả multi-room booking với product/rate selection riêng theo phòng: https://developers.booking.com/demand/docs/migration-guide/v3/migration-faqs

## Checkout theo giao diện Bookese

Giữ bố cục bốn mục bên trái (Thông tin đặt phòng, Thông tin liên hệ, Voucher/Giảm giá, Phương thức thanh toán) và Tóm tắt giá bên phải. Khách/giường hiển thị gọn trong từng loại phòng; mở chi tiết để xem các dòng phụ thu. Giá, khách, giường và điều kiện gói lấy từ lựa chọn hiện tại, không tính lại theo tổng khách cho từng phòng. Thuế/phí được ghi đã bao gồm theo mô hình giá hiện tại; không tự suy ra hoặc cộng thêm tỷ lệ thuế từ ảnh tham chiếu.

Thông tin liên hệ, yêu cầu đặc biệt, nhận phòng dự kiến và hóa đơn được giữ khi quay lại sửa phòng trong cùng phiên. Biểu mẫu kiểm tra thông tin bắt buộc và điều khoản trước khi tạo đơn mô phỏng. Gói Linh hoạt giữ thanh toán tại chỗ nghỉ. Voucher và Xu chỉ tái hiện giao diện, không giảm giá; không nối thanh toán hoặc gửi thông tin cá nhân. Dùng dữ liệu minh họa để kiểm tra.

## Phương án 2: hệ thống tự tính phụ thu

Mở `?mode=automatic#/customer/hotel`; thêm `&sample=ab` trước hash để dùng ví dụ riêng A/B. Nút chuyển phương án ở đầu trang giữ cả phương án khách tự điều chỉnh. Dữ liệu A/B không ghi vào cấu hình Extranet: A tiêu chuẩn 2, tối đa 4, giá 700k; B tiêu chuẩn 3, tối đa 5, giá 800k; mỗi phòng 1 giường phụ 200k, người lớn thêm dùng giường có sẵn 150k.

- Tìm nhiều phòng: đề xuất rẻ nhất trong các tổ hợp từ 1 đến số phòng đã tìm. Hiển thị rõ số phòng thực tế khi khác yêu cầu. Khách có thể tự chọn nhiều phòng hơn (tối đa 6) nếu tồn kho và số người lớn cho phép. Cả hai phương án dùng cùng quy tắc đề xuất và chọn số phòng.
- Mỗi lần thay đổi số lượng/gói giá, tối ưu lại cách phân khách và giường nội bộ. Giường phụ áp dụng trước cho khách tính giá người lớn vượt tiêu chuẩn; trẻ nhỏ dùng giường có sẵn; không gộp sức chứa/giới hạn trẻ em của các phòng thành một giới hạn chung. Suất tiêu chuẩn ưu tiên khách tính giá người lớn, rồi đến trẻ em. Không tự thêm giường phụ cho trẻ dưới mốc giá người lớn.
- Nếu chưa đủ chỗ: chỉ báo giá tạm tính cho tập khách lớn nhất có thể chứa, nêu số khách chưa có chỗ và khóa đặt phòng. Báo giá này không được chuyển thành đơn đặt phòng.
- PA2 hiển thị số lượng từng loại phòng và phụ thu toàn đơn riêng biệt tại bảng Phòng trống, checkout, xác nhận và đơn Extranet. Gộp số lượng phụ thu cùng loại/cùng đơn giá giữa các loại phòng; khác đơn giá tách dòng. Không công bố phụ thu, giường phụ hay khách thuộc phòng nào; giá theo loại phòng chỉ là giá cơ bản, không kèm phụ thu. Bằng chứng phân bổ hợp lệ vẫn được giữ nội bộ để kiểm tra giới hạn và giá; đổi loại/số lượng phải tính lại toàn bộ, không cho tự chuyển phụ thu.
- A×1 cho 5 người: tạm tính 4/5 khách = 1.050.000đ, chưa được đặt. A×2: 1.600.000đ, chỉ 1 giường phụ. B×1: 1.150.000đ, đủ 5 khách với 1 giường phụ và 1 phụ thu người lớn dùng giường có sẵn. A+B: 1.500.000đ, không phụ thu, tổng tiêu chuẩn 5.

Đây là phương án sản phẩm Bookese theo yêu cầu, không khẳng định là quy tắc chung của Booking.com.


### Chỗ tiêu chuẩn cho trẻ em ở cả hai phương án

Số khách tiêu chuẩn bao gồm người lớn và trẻ em. Trẻ em dùng chỗ tiêu chuẩn còn trống trong từng phòng không bị tính phụ thu. Khách tính giá người lớn ngoài số tiêu chuẩn áp dụng giường phụ ưu tiên, sau đó phụ thu người lớn; trẻ dưới mốc giá người lớn ngoài tiêu chuẩn dùng giường có sẵn và phụ thu theo tuổi; luôn kiểm tra giới hạn từng phòng. Trong các cách bố trí hợp lệ, hệ thống tối ưu tổng giá. Phương án 1 và 2 dùng chung chính sách tính giá trong engine, không có nhánh giá riêng theo phương án.

Ví dụ 5 người lớn + 1 trẻ 8 tuổi, Awaken tiêu chuẩn 2: chọn 3 phòng = 2.100.000đ, không phụ thu; chọn 2 phòng = 1.700.000đ gồm 1 giường phụ 200.000đ và 1 phụ thu trẻ em 100.000đ. Trẻ dưới tuổi miễn phí không phụ thu; trẻ từ mốc giá người lớn áp dụng quy tắc giường phụ như người lớn. Chọn 3 phòng vẫn hợp lệ dù ban đầu tìm 2 phòng. Không chuyển chỗ tiêu chuẩn trống của phòng khác để bỏ qua giới hạn người lớn/trẻ em trong một phòng.

Trong cả hai phương án, trẻ dưới mốc giá người lớn có thể ngủ chung giường có sẵn trong giới hạn tổng khách và trẻ em của phòng. Công thức chỗ thêm giường có sẵn suy ra từ `max − base − beds` chỉ giới hạn chỗ khách tính giá người lớn; không ép trẻ ngủ chung phải có giường phụ. Sức chứa tối đa không tăng.


## Quy tắc dùng chung cho PA 1 và PA 2

Cùng cấu hình, gói giá, số phòng và cách bố trí sẽ có cùng giá. PA 1 cho khách chuyển người và điều chỉnh giường cho khách tính giá người lớn, PA 2 tự bố trí và chỉ xác nhận số dịch vụ toàn đơn, không gắn dịch vụ với loại phòng. Khi chuyển người ở PA 1, tính lại giường và phụ thu; bố trí vượt sức chứa/giới hạn trẻ em/người lớn bị khóa đặt. Trẻ dưới mốc giá người lớn không chọn giường phụ. Chọn 3 phòng dù tìm 2 phòng được phép; checkout dùng số phòng thực chọn.

Case 5 người lớn + trẻ 8 tuổi: 2 Awaken = 1.700.000đ (1 giường phụ + 1 phí trẻ); 3 Awaken tối ưu = 2.100.000đ, không phụ thu. Nếu khách tự dồn người vào một phòng dù phòng khác còn suất, phí được tính theo bố trí thực tế từng phòng. Hai phương án cùng dùng `suggestedBeds`, `priceRoom`, `validateBooking`, `quoteAutomatic` và bộ đề xuất; thay đổi quy tắc sau này áp dụng cả hai.


## PA 1: chọn phòng nhận giường phụ / phụ thu

Nút **Đổi phòng** xuất hiện cạnh phụ thu gộp theo loại phòng trong cột Giá. Cột này hiển thị giá cơ bản theo đêm, số khách tiêu chuẩn và phụ thu × số lượng, không hiển thị tổng tiền từng phòng. Cột Lựa chọn của bạn chỉ hiển thị gói giá và cơ cấu khách. Hộp chọn chỉ liệt kê loại phòng khác đã đặt, giá sau chuyển và lý do không nhận được; không cho chuyển giữa các phòng cùng loại. Mỗi lần chuyển một dịch vụ và hệ thống tự chọn phòng nguồn/đích hợp lệ trong hai loại phòng. Áp dụng chuyển cả khách đi kèm; ưu tiên chuyển trực tiếp, nếu không được thì thử đổi chỗ một khách ở phòng đích. Mọi thay đổi và chênh lệch giá được xem trước. Chỉ áp dụng khi toàn bộ booking hợp lệ; có Hoàn tác. Chi tiết khách & giá mở popup chỉ đọc: khách, loại giường, giá và phụ thu từng phòng; không có bộ chọn phòng/giường. Đơn giá dịch vụ cạnh nút Đổi phòng hiển thị theo đêm; tổng trong popup là toàn bộ số đêm và có phép nhân khi lưu trú nhiều đêm.

Ví dụ 5 người lớn, Awaken + alo ha: chuyển 1 giường phụ từ alo ha sang Awaken đổi thành 3 người lớn ở Awaken (900k) và 2 ở alo ha (800k), tổng vẫn 1.700k với phí giường bằng nhau. Nếu phí giường khác nhau, tính theo phòng đích và số đêm. Nếu giường đích hết mức hoặc không được cung cấp, không chọn được. Nếu cần đổi chỗ trẻ để không vượt sức chứa, xem trước sẽ nói rõ. Chuyển trẻ sang suất tiêu chuẩn còn trống có thể làm phụ thu trẻ biến mất.


### Cấu hình phụ thu theo loại phòng (26/10)
- Mốc tuổi và một giá trẻ em dùng chung cho toàn chỗ nghỉ. Chỉ giá người lớn/trẻ đạt mốc giá người lớn được cài riêng theo loại phòng. Trẻ dưới mốc miễn phí giữ 0đ.
- Giường phụ có một giá chung toàn chỗ nghỉ; từng loại phòng vẫn bật/tắt và giới hạn số giường riêng. Giường phụ ưu tiên trước cho khách tính giá người lớn thêm.
- PA1, PA2, tìm kiếm, chuyển phụ thu và checkout dùng chung cách tính. Chuyển trẻ sang loại phòng khác giữ đơn giá trẻ em chung; chỉ phát sinh phí khi vượt suất tiêu chuẩn. Đơn giá giường phụ chung không đổi.
- Lịch sử chuyển sang v4: sao chép giá trẻ/người lớn cũ vào từng phòng; đề xuất giá giường phụ từ loại phòng bật giường phụ đầu tiên (hoặc phòng đầu tiên có giá). Nếu giá cũ khác nhau, hiện thông báo để kiểm tra trước khi lưu. Các giá cũ được giữ trong thông báo đến khi nhấn Cập nhật. Không tự ghi đè localStorage trong lúc chuyển đổi.

PA1 hiển thị phụ thu và bố trí tạm tính ngay cả khi số phòng chưa đủ cho cả nhóm. Chi tiết dùng đúng tập khách xếp được; checkout và chuyển phụ thu chờ đến khi đủ chỗ. Thay đổi số phòng tính lại toàn bộ bản tạm tính.


### UX rút gọn và giá trẻ em chung (v5)
Ba khối: trẻ em (mốc tuổi + một giá chung), người lớn thêm (giá từng phòng), giường phụ (giá chung + bảng bật/tắt, số giường, sức chứa). Giải thích chi tiết được thu gọn. Không nhập giá trẻ em riêng cho từng phòng.
Dữ liệu v4 dùng giá trẻ em của phòng đầu tiên làm giá chung; nếu các giá cũ khác nhau, hiển thị mục kiểm tra giá cũ có thể mở. Giữ nguyên giá người lớn từng phòng, mốc tuổi, giá giường phụ và giới hạn. v1–v3 giữ giá trẻ em chung cũ. Lưu bằng Cập nhật; không tự ghi đè cấu hình đã lưu.

### PA1: giữ vị trí phụ thu khi đổi số lượng phòng
Khi khách thay đổi số lượng, tính lại phương án hợp lệ có tổng giá thấp nhất, sau đó ưu tiên giữ giường phụ/phụ thu ở loại phòng đang hiển thị bằng các lần chuyển hoặc đổi chỗ hợp lệ có cùng tổng tiền. Áp dụng cả bản tạm tính chưa đủ khách và bố trí khách đã chủ động chuyển. Không giữ khoản phụ thu đã hết cần thiết, không tăng giá để giữ vị trí và không vượt giới hạn phòng. PA2 tiếp tục tự tính độc lập.
Ví dụ chọn 1 Awaken cho 5 người lớn: tạm tính 3 khách + 1 giường phụ. Thêm 1 alo ha: giữ 3 khách + 1 giường phụ tại Awaken, 2 khách tại alo ha, tổng 1.700.000đ. Nếu chọn đủ 3 phòng tiêu chuẩn 2 khách, phụ thu không còn cần thiết và được bỏ.

### Tooltip chi tiết giá
Nút ⓘ cạnh giá cơ bản 1 phòng/1 đêm ở cả PA1 và PA2. Tooltip dùng số phòng đang chọn (hoặc tham khảo 1 phòng), liệt kê từng đêm, thuế/phí đã bao gồm, tổng và xu dự kiến 2% như checkout. Prototype chưa cấu hình tách VAT/phí dịch vụ nên không tự tạo tỷ lệ hoặc cộng thuế lần nữa. PA1 lấy phụ thu từ báo giá đã kiểm tra của loại phòng; bản chưa đủ khách ghi tạm tính. PA2 chỉ hiển thị tiền phòng, hướng dẫn xem phụ thu toàn đơn tại Tổng tiền. Gói chưa chọn không nhận phụ thu từ gói khác. Tooltip mở bằng rê chuột, bấm hoặc bàn phím; Escape đóng.
