<template>
    <footer class="footer">
        <div class="footer-top">
            <div class="container">
                <div class="row">
                    <!-- Company Info -->
                    <div class="col-lg-4 col-md-6 footer-info">
                        <div class="footer-logo">
                            <i class="fas fa-store fa-2x text-warning"></i>
                            <span class="ms-2 fw-bold">T-Store</span>
                        </div>
                        <p>T-Store - Thương hiệu thời trang hàng đầu Việt Nam với sứ mệnh mang đến phong cách thời trang
                            hiện đại cho giới trẻ.</p>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-phone"></i>
                                <span>1900 xxxx</span>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <span>contact@tstore.com</span>
                            </div>
                        </div>
                        <div class="social-links">
                            <a href="#" class="facebook"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" class="instagram"><i class="fab fa-instagram"></i></a>
                            <a href="#" class="tiktok"><i class="fab fa-tiktok"></i></a>
                            <a href="#" class="youtube"><i class="fab fa-youtube"></i></a>
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div class="col-lg-2 col-md-6 footer-links">
                        <h4>Liên kết nhanh</h4>
                        <ul>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/about">Về chúng tôi</router-link>
                            </li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/products">Sản phẩm</router-link>
                            </li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/blog">Blog</router-link></li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/contact">Liên hệ</router-link>
                            </li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/faq">FAQ</router-link></li>
                        </ul>
                    </div>

                    <!-- Customer Service -->
                    <div class="col-lg-3 col-md-6 footer-links">
                        <h4>Hỗ trợ khách hàng</h4>
                        <ul>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/shipping">Chính sách vận
                                    chuyển</router-link></li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/returns">Chính sách đổi
                                    trả</router-link></li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/size-guide">Hướng dẫn chọn
                                    size</router-link></li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/warranty">Chính sách bảo
                                    hành</router-link></li>
                            <li><i class="fas fa-chevron-right"></i> <router-link to="/loyalty">Chương trình thành
                                    viên</router-link></li>
                        </ul>
                    </div>

                    <!-- Newsletter -->
                    <div class="col-lg-3 col-md-6 footer-newsletter">
                        <h4>Đăng ký nhận tin</h4>
                        <p>Đăng ký để nhận thông tin về sản phẩm mới và các chương trình khuyến mãi hấp dẫn</p>
                        <form @submit.prevent="handleSubscribe">
                            <div class="input-group">
                                <input type="email" class="form-control" placeholder="Email của bạn" v-model="email">
                                <button type="submit" class="btn btn-warning">Đăng ký</button>
                            </div>
                        </form>
                        <div class="payment-methods">
                            <h5>Phương thức thanh toán</h5>
                            <div class="payment-icons">
                                <i class="fab fa-cc-visa fa-2x"></i>
                                <i class="fab fa-cc-mastercard fa-2x"></i>
                                <i class="fas fa-wallet fa-2x"></i>
                                <i class="fas fa-money-bill-wave fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="copyright">
                            &copy; 2024 <strong>T-Store</strong>. All Rights Reserved
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="footer-bottom-links">
                            <router-link to="/privacy">Chính sách bảo mật</router-link>
                            <router-link to="/terms">Điều khoản sử dụng</router-link>
                            <router-link to="/sitemap">Sitemap</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

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
            // Xử lý logic đăng ký newsletter
            console.log('Subscribe with email:', this.email)
            this.email = ''
        }
    }
}
</script>

<style scoped>
.footer {
    background: #222;
    color: #fff;
    font-size: 0.95rem;
    position: relative;
    padding-top: 80px;
}

.footer-top {
    padding-bottom: 60px;
}

.footer-info {
    margin-bottom: 30px;
}

.footer-logo {
    margin-bottom: 20px;
}

.contact-info {
    margin: 20px 0;
}

.contact-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.contact-item i {
    width: 30px;
    color: var(--bs-warning);
}

.social-links {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.social-links a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: #fff;
    transition: all 0.3s ease;
}

.social-links a:hover {
    background: var(--bs-warning);
    color: #000;
    transform: translateY(-3px);
}

.footer h4 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 25px;
    position: relative;
    padding-bottom: 10px;
}

.footer h4::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 2px;
    background: var(--bs-warning);
}

.footer-links {
    margin-bottom: 30px;
}

.footer-links ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.footer-links ul li {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
}

.footer-links ul li i {
    font-size: 0.8rem;
    margin-right: 10px;
    color: var(--bs-warning);
    transition: transform 0.3s ease;
}

.footer-links ul li:hover i {
    transform: translateX(5px);
}

.footer-links ul li a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-links ul li a:hover {
    color: var(--bs-warning);
}

.footer-newsletter {
    margin-bottom: 30px;
}

.footer-newsletter p {
    margin-bottom: 20px;
}

.footer-newsletter .input-group {
    margin-bottom: 20px;
}

.payment-methods {
    margin-top: 30px;
}

.payment-methods h5 {
    font-size: 1rem;
    margin-bottom: 15px;
}

.payment-icons {
    display: flex;
    gap: 15px;
    align-items: center;
}

.payment-icons img {
    height: 30px;
    object-fit: contain;
}

.footer-bottom {
    background: #1a1a1a;
    padding: 20px 0;
    font-size: 0.9rem;
}

.copyright {
    text-align: center;
}

.footer-bottom-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 10px;
}

.footer-bottom-links a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-bottom-links a:hover {
    color: var(--bs-warning);
}

@media (max-width: 768px) {
    .footer {
        padding-top: 50px;
    }

    .footer-top {
        padding-bottom: 30px;
    }

    .footer h4 {
        margin-top: 30px;
    }

    .footer-bottom-links {
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
}
</style>
