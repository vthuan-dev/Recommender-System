<template>
    <div class="container py-5">
      <div class="row">
        <div class="col-md-6">
          <i class="fas fa-laptop fa-8x text-primary"></i>
        </div>
        <div class="col-md-6">
          <h1>{{ product?.name }}</h1>
          <div class="price-section mb-4">
            <span class="old-price">{{ formatPrice(product?.original_price) }}</span>
            <h2 class="current-price">{{ formatPrice(product?.price) }}</h2>
          </div>
          <button class="btn btn-primary btn-lg" @click="addToCart(product)">
            <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProductDetailView'
  }
  </script>