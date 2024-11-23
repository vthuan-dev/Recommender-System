export default {
    namespaced: true,
    
    state: {
      items: []
    },
  
    mutations: {
      ADD_TO_CART(state, item) {
        const existingItem = state.items.find(
          i => i.variant_id === item.variant_id
        );
  
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          state.items.push(item);
        }
      }
    },
  
    actions: {
      async addToCart({ commit }, item) {
        try {
          // Có thể thêm API call ở đây nếu cần
          commit('ADD_TO_CART', item);
        } catch (error) {
          console.error('Add to cart error:', error);
          throw error;
        }
      }
    }
  };