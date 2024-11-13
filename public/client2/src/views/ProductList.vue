<template>
    <div class="container py-5">
      <h1>Danh sách sản phẩm</h1>
      <div class="row g-4">
        <div v-for="product in products" :key="product.id" class="col-md-3">
          <div class="product-card card h-100 border-0 shadow-sm">
            <div class="position-relative text-center p-4">
              <i class="fas fa-laptop fa-4x text-primary"></i>
              <div v-if="product.discount" class="sale-badge">-{{ product.discount }}%</div>
            </div>
            <div class="card-body">
              <h5 class="product-title">{{ product.name }}</h5>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span v-if="product.original_price" class="old-price">{{ formatPrice(product.original_price) }}</span>
                  <p class="price mb-0">{{ formatPrice(product.price) }}</p>
                </div>
                <button class="btn btn-primary btn-sm" @click="addToCart(product)">
                  <i class="fas fa-cart-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProductListView'
  }
  </script>