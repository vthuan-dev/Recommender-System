# Hệ Thống Gợi Ý Sản Phẩm cho Thương Mại Điện Tử

Dự án này xây dựng một hệ thống gợi ý sản phẩm toàn diện cho các doanh nghiệp thương mại điện tử, nhằm nâng cao trải nghiệm mua sắm và cải thiện việc thu hút và giữ chân khách hàng.

## Tổng Quan

Hệ thống gợi ý được chia thành ba phần, đáp ứng các giai đoạn khác nhau trong hành trình của khách hàng:

1. **Hệ Thống Gợi Ý Phần I:** Hệ thống dựa trên độ phổ biến của sản phẩm, nhắm đến khách hàng mới
2. **Hệ Thống Gợi Ý Phần II:** Hệ thống lọc cộng tác dựa trên mô hình, dựa vào lịch sử mua hàng và đánh giá của khách hàng
3. **Hệ Thống Gợi Ý Phần III:** Phương pháp cho các doanh nghiệp mới thiết lập website thương mại điện tử lần đầu tiên mà chưa có đánh giá sản phẩm

## Bộ Dữ Liệu

Dự án sử dụng [bộ dữ liệu đánh giá sản phẩm Amazon](https://www.kaggle.com/skillsmuggler/amazon-ratings) từ Kaggle. Bộ dữ liệu này bao gồm các thông tin sau:
- UserId: ID của người dùng
- ProductId: ID của sản phẩm
- Rating: Đánh giá của người dùng (thang điểm từ 1 đến 5)
- Timestamp: Thời gian đánh giá

## Cấu Trúc Dự Án

Dự án được triển khai trong một Jupyter Notebook, bao gồm các phần chính:

1. Nhập thư viện cần thiết
2. Tải và xử lý dữ liệu
3. Phân tích dữ liệu và trực quan hóa
4. Xây dựng hệ thống gợi ý dựa trên độ phổ biến
5. Xây dựng hệ thống gợi ý dựa trên lọc cộng tác

## Công Nghệ Sử Dụng

- Python
- Pandas cho xử lý dữ liệu
- Matplotlib và Seaborn cho trực quan hóa dữ liệu
- Scikit-learn cho các mô hình học máy, bao gồm TruncatedSVD

## Cách Sử Dụng

1. Clone repository này
2. Cài đặt các thư viện cần thiết:
   ```
   pip install numpy pandas matplotlib scikit-learn
   ```
3. Tải bộ dữ liệu từ Kaggle và đặt vào thư mục `input/amazon-ratings/`
4. Mở và chạy Jupyter Notebook `product-recommendation-system-for-e-commerce.ipynb`

## Kết Quả

Dự án này cung cấp insights về các sản phẩm phổ biến nhất dựa trên số lượng đánh giá. Ví dụ, sản phẩm có ID B001MA0QY2 là sản phẩm được đánh giá nhiều nhất với 7533 đánh giá.



## Giấy Phép

<!-- Dự án này là mã nguồn mở và có sẵn dưới [Giấy phép MIT](LICENSE). -->
