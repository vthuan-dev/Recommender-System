export default {
  state: {
    unreadMessages: 0,
    activeChats: [],
    currentChat: null
  },
  
  mutations: {
    INCREMENT_UNREAD: state => state.unreadMessages++,
    RESET_UNREAD: state => state.unreadMessages = 0,
    SET_ACTIVE_CHATS: (state, chats) => state.activeChats = chats,
    SET_CURRENT_CHAT: (state, chat) => state.currentChat = chat
  },
  
  actions: {
    newMessage({ commit }) {
      commit('INCREMENT_UNREAD')
    },
    openChat({ commit }) {
      commit('RESET_UNREAD')
    }
  }
} 