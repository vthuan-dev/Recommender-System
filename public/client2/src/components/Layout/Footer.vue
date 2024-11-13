<template>
  <footer class="site-footer">
    <!-- Newsletter Section -->
    <div class="newsletter-section">
      <div class="container">
        <div class="newsletter-wrapper">
          <div class="newsletter-content">
            <h3>Đăng ký nhận thông tin</h3>
            <p>Nhận ngay voucher 100.000đ khi đăng ký</p>
          </div>
          <form @submit.prevent="handleSubscribe" class="newsletter-form">
            <div class="input-group">
              <input 
                type="email" 
                v-model="email"
                placeholder="Nhập email của bạn"
                required
              >
              <button type="submit">
                Đăng ký
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="footer-main">
      <div class="container">
        <div class="row g-4">
          <!-- Company Info -->
          <div class="col-lg-4">
            <div class="footer-brand">
              <i class="fas fa-store"></i>
              <span>T-Store</span>
            </div>
            <p class="footer-about">
              T-Store - Hệ thống cửa hàng công nghệ hàng đầu Việt Nam, mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng.
            </p>
            <div class="footer-contact">
              <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
              </div>
              <div class="contact-item">
                <i class="fas fa-phone-alt"></i>
                <a href="tel:1900xxxx">1900 xxxx</a>
              </div>
              <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <a href="mailto:contact@tstore.com">contact@tstore.com</a>
              </div>
            </div>
            <div class="social-links">
              <a href="#" class="social-link" title="Facebook">
                <i class="fab fa-facebook-f"></i>
              </a>
              <a href="#" class="social-link" title="Instagram">
                <i class="fab fa-instagram"></i>
              </a>
              <a href="#" class="social-link" title="TikTok">
                <i class="fab fa-tiktok"></i>
              </a>
              <a href="#" class="social-link" title="YouTube">
                <i class="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="col-lg-4 col-md-6">
            <h4 class="footer-title">Về T-Store</h4>
            <ul class="footer-links">
              <li><router-link to="/about">Giới thiệu</router-link></li>
              <li><router-link to="/career">Tuyển dụng</router-link></li>
              <li><router-link to="/stores">Hệ thống cửa hàng</router-link></li>
              <li><router-link to="/contact">Liên hệ</router-link></li>
            </ul>
          </div>

          <!-- Customer Service -->
          <div class="col-lg-4 col-md-6">
            <h4 class="footer-title">Hỗ trợ khách hàng</h4>
            <ul class="footer-links">
              <li><router-link to="/shipping">Chính sách vận chuyển</router-link></li>
              <li><router-link to="/returns">Chính sách đổi trả</router-link></li>
              <li><router-link to="/warranty">Chính sách bảo hành</router-link></li>
              <li><router-link to="/payment">Phương thức thanh toán</router-link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <p class="copyright">
              © 2024 <strong>T-Store</strong>. Tất cả quyền được bảo lưu.
            </p>
          </div>
          <div class="col-md-6">
            <div class="footer-bottom-links">
              <router-link to="/privacy">Chính sách bảo mật</router-link>
              <router-link to="/terms">Điều khoản sử dụng</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #111827;
  color: #fff;
}

.newsletter-section {
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  padding: 60px 0;
}

.newsletter-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.newsletter-content h3 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
}

.newsletter-content p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.newsletter-form {
  flex: 1;
  max-width: 500px;
}

.input-group {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 5px;
}

.input-group input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 15px 25px;
  color: #fff;
  font-size: 16px;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.input-group button {
  background: #fff;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  color: #4f46e5;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.input-group button:hover {
  transform: translateX(5px);
}

.footer-main {
  padding: 80px 0;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 25px;
}

.footer-about {
  color: #9ca3af;
  line-height: 1.7;
  margin-bottom: 30px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.contact-item i {
  width: 35px;
  height: 35px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
}

.contact-item a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-item a:hover {
  color: #4f46e5;
}

.social-links {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.social-link {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #4f46e5;
  transform: translateY(-5px);
}

.footer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 25px;
  position: relative;
}

.footer-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 40px;
  height: 2px;
  background: #4f46e5;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 15px;
}

.footer-links a {
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-links a:hover {
  color: #4f46e5;
  transform: translateX(8px);
}

.footer-bottom {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.copyright {
  margin: 0;
  color: #9ca3af;
}

.footer-bottom-links {
  display: flex;
  justify-content: flex-end;
  gap: 30px;
}

.footer-bottom-links a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-bottom-links a:hover {
  color: #4f46e5;
}

@media (max-width: 992px) {
  .newsletter-wrapper {
    flex-direction: column;
    text-align: center;
  }

  .newsletter-form {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .footer-bottom-links {
    justify-content: center;
    margin-top: 15px;
  }

  .copyright {
    text-align: center;
  }
}
</style>

<script>
export default {
  name: 'FooterComponent',
  data() {
    return {
      email: ''
    }
  },
  methods: {
    handleSubscribe() {
      // Xử lý đăng ký newsletter
      console.log('Subscribe email:', this.email)
      this.email = ''
    }
  }
}
</script>
