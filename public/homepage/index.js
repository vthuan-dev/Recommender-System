//slideshow 
var slideIndex = 0;
showSlides();

// chuyển từ slide này sang slide khác
function showSlides() {
    var i;
    // lấy tất cả các slide
    var slides = document.getElementsByClassName("mySlides");
    // ẩn tất cả các slide
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1
    }    
    slides[slideIndex-1].style.display = "block";  
    setTimeout(showSlides, 2000); // Change image every 2 seconds
}


// When the user scrolls down to the bottom of the page, show the button

// Hàm để format giá tiền
function formatCurrency(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Cấu hình các category và container ID tương ứng - cập nhật theo ID trong homepage.html
const CATEGORIES = {
  BESTSELLERS: { id: 'bestsellers', name: 'Sản phẩm bán chạy', containerId: 'bestsellers-container' },
  PHONES: { id: 1, name: 'Điện thoại di động', containerId: 'phone-list' },
  LAPTOPS: { id: 2, name: 'Laptop', containerId: 'laptop-list' },
  TABLETS: { id: 3, name: 'Máy tính bảng', containerId: 'tablet-list' },
  MOBILE_ACC: { id: 4, name: 'Phụ kiện điện thoại', containerId: 'mobile-acc-container' },
  PC_ACC: { id: 5, name: 'Phụ kiện máy tính', containerId: 'pc-acc-container' },
  AUDIO: { id: 6, name: 'Thiết bị âm thanh', containerId: 'audio-container' },
  SMARTWATCH: { id: 7, name: 'Đồng hồ thông minh', containerId: 'smartwatch-container' },
  CAMERA: { id: 8, name: 'Máy ảnh', containerId: 'camera-container' },
  NETWORK: { id: 9, name: 'Thiết bị mạng', containerId: 'network-container' },
  SMART_DEVICES: { id: 10, name: 'Thiết bị thông minh', containerId: 'smart-device-container' }
};

// Hàm tạo stars cho rating
function getRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);
  
  return [
    ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
    hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : '',
    ...Array(emptyStars).fill('<i class="far fa-star"></i>')
  ].join('');
}

// Hàm thêm vào giỏ hàng
function addToCart(productId) {
  $.ajax({
    type: "POST",
    url: "../giohang/giohang.php",
    data: {action: 'add', product_id: productId},
    success: function(response){
      alert("Sản phẩm đã được thêm vào giỏ hàng");
    },
    error: function(error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  });
}

// Hàm load sản phẩm theo category
async function loadCategoryProducts(category) {
  try {
    console.log(`Đang tải sản phẩm cho category ${category.id}`);
    const url = category.id === 'bestsellers' 
      ? '/products/bestsellers'
      : `/products/category/${category.id}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const container = document.getElementById(category.containerId);
    
    if (!container) {
      console.error(`Không tìm thấy container cho ${category.name}`);
      return;
    }

    const products = category.id === 'bestsellers' ? data : data.products;

    if (products && products.length > 0) {
      container.innerHTML = products.map(product => `
        <div class="col-6 col-md-4 col-lg-3 mb-4">
          <div class="card product-card h-100">
            <img src="${product.image_url || '../img/default-product.jpg'}" 
                 class="card-img-top" 
                 alt="${product.name}"
                 onerror="this.src='../img/default-product.jpg'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title flex-grow-1">${product.name}</h5>
              <div class="mt-auto">
                <p class="card-text text-danger fw-bold mb-2">
                  ${formatCurrency(product.min_price || product.price || 0)}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="rating">
                    <span class="text-warning">
                      ${getRatingStars(product.rating?.average || 0)}
                    </span>
                    <small class="text-muted">(${product.rating?.count || 0})</small>
                  </div>
                  <small class="text-muted">Đã bán: ${product.total_sold || 0}</small>
                </div>
                <button class="btn btn-warning btn-sm w-100 mt-2 add-to-cart" 
                        data-product-id="${product.id}">
                  <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Thêm sự kiện cho các nút thêm vào giỏ
      addCartEventListeners(container);
    } else {
      container.innerHTML = '<div class="col-12"><p class="text-center">Không có sản phẩm nào trong danh mục này</p></div>';
    }
  } catch (error) {
    console.error(`Lỗi khi tải sản phẩm category ${category.name}:`, error);
    const container = document.getElementById(category.containerId);
    if (container) {
      container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Đã xảy ra lỗi khi tải sản phẩm</p></div>';
    }
  }
}

// Load tất cả danh mục khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
  console.log('Trang đã load xong, bắt đầu tải sản phẩm...');
  Object.values(CATEGORIES).forEach(category => {
    loadCategoryProducts(category);
  });
});

// Thêm sự kiện cho nút thêm vào giỏ
function addCartEventListeners(container) {
  container.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.dataset.productId;
      addToCart(productId);
    });
  });
}

// Thêm CSS cho card sản phẩm
const style = document.createElement('style');
style.textContent = `
    .product-card {
        transition: transform 0.2s, box-shadow 0.2s;
        border: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .product-card .card-img-top {
        height: 200px;
        object-fit: contain;
        padding: 1rem;
    }

    .product-card .card-title {
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        height: 2.4rem;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .rating {
        font-size: 0.8rem;
    }

    .add-to-cart {
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);
