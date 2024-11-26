<template>
  <div class="chatbot-container" :class="{ 'chatbot-open': isOpen }">
    <!-- Chat Button -->
    <button class="chat-toggle-btn" @click="toggleChat">
      <i class="fas" :class="isOpen ? 'fa-times' : 'fa-headset'"></i>
      <span v-if="!isOpen && unreadCount" class="unread-badge">{{ unreadCount }}</span>
    </button>

    <!-- Chat Window -->
    <div class="chat-window">
      <div class="chat-header">
        <div class="chat-title">
          <i class="fas fa-headset"></i>
          <span>T-Store Support</span>
        </div>
        <small class="chat-subtitle">Tin nhắn khách hàng</small>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" ref="messageContainer">
        <div v-for="(message, index) in messages" 
             :key="index" 
             class="message"
             :class="message.sender_id === adminId ? 'sent' : 'received'">
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
          </div>
          <small class="message-time">{{ formatTime(message.created_at) }}</small>
        </div>
        <div v-if="isTyping" class="message received">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input">
        <input 
          type="text" 
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Nhập tin nhắn..."
          :disabled="isTyping"
        >
        <button @click="sendMessage" :disabled="!newMessage || isTyping">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import io from 'socket.io-client'

export default {
  name: 'AdminChat',
  setup() {
    const store = useStore()
    const isOpen = ref(false)
    const newMessage = ref('')
    const messages = ref([])
    const isTyping = ref(false)
    const messageContainer = ref(null)
    const socket = ref(null)
    const adminId = ref(null)
    const unreadCount = ref(0)

    // Khởi tạo axios interceptor
    axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    const connectSocket = () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          return
        }

        socket.value = io('http://localhost:3000', {
          auth: {
            token: token
          }
        })

        socket.value.on('connect', () => {
          console.log('Admin socket connected')
        })

        socket.value.on('new_message', (message) => {
          messages.value.push(message)
          if (!isOpen.value) {
            unreadCount.value++
          }
        })

        socket.value.on('user_typing', (data) => {
          isTyping.value = true
          setTimeout(() => {
            isTyping.value = false
          }, 3000)
        })
      } catch (error) {
        console.error('Error connecting socket:', error)
      }
    }

    onMounted(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          return
        }

        const response = await axios.get('http://localhost:3000/api/admin/profile')
        adminId.value = response.data.id
        connectSocket()
        await loadMessages()
      } catch (error) {
        console.error('Error initializing admin chat:', error)
      }
    })

    const loadMessages = async () => {
      try {
        const response = await axios.get('/api/chat/messages')
        messages.value = response.data
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    const sendMessage = async () => {
      if (!newMessage.value || isTyping.value) return

      try {
        socket.value.emit('send_message', {
          message: newMessage.value,
          receiverId: messages.value[messages.value.length - 1]?.sender_id
        });

        await axios.post('/api/chat/messages', {
          content: newMessage.value,
          receiverId: messages.value[messages.value.length - 1]?.sender_id
        })

        newMessage.value = ''
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }

    watch(messages, () => {
      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      })
    })

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      isOpen,
      newMessage,
      messages,
      isTyping,
      messageContainer,
      adminId,
      unreadCount,
      sendMessage,
      toggleChat: () => {
        isOpen.value = !isOpen.value
        if (isOpen.value) {
          unreadCount.value = 0
        }
      },
      formatTime
    }
  }
}
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chatbot-container.chatbot-open .chat-window {
  transform: scale(1);
  opacity: 1;
}

.chat-toggle-btn {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  border: none;
  color: white;
  box-shadow: 0 4px 20px rgba(44, 62, 80, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.chat-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(44, 62, 80, 0.4);
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 600px;
  background: #1a1a1a;
  border-radius: 20px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  opacity: 0;
  transform-origin: bottom right;
  transition: all 0.3s ease;
  overflow: hidden;
}

.chat-header {
  padding: 20px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  color: white;
  border-radius: 20px 20px 0 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.chat-subtitle {
  opacity: 0.8;
  font-size: 0.9rem;
  margin-top: 5px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #1a1a1a;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #2c2c2c;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #3498db;
  border-radius: 3px;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
}

.message.sent {
  margin-left: auto;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 15px;
  background: #2c2c2c;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.message.sent .message-text {
  background: #3498db;
  color: white;
}

.message.received .message-text {
  background: #2c3e50;
  color: white;
}

.message-time {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.8rem;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 12px 16px;
  background: #2c2c2c;
  border-radius: 15px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #3498db;
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-5px); opacity: 1; }
}

.chat-input {
  padding: 20px;
  background: #2c2c2c;
  border-top: 1px solid #333;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #333;
  border-radius: 12px;
  background: #1a1a1a;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.chat-input input::placeholder {
  color: #666;
}

.chat-input button {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.chat-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(231, 76, 60, 0.3);
}

/* Animation cho tin nhắn mới */
@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.message {
  animation: slideIn 0.3s ease forwards;
}
</style> 