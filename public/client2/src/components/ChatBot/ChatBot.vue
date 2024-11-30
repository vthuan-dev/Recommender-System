<template>
  <div class="chatbot-container" :class="{ 'chatbot-open': isOpen }">
    <!-- Chat Button -->
    <button class="chat-toggle-btn" @click="toggleChat">
      <i class="fas" :class="isOpen ? 'fa-times' : 'fa-robot'"></i>
    </button>

    <!-- Chat Window -->
    <div class="chat-window">
      <div class="chat-header">
        <div class="chat-title">
          <i class="fas fa-robot"></i>
          <span>T-Store AI Assistant</span>
        </div>
        <small class="chat-subtitle">Hỏi tôi bất cứ điều gì</small>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" ref="messageContainer">
        <div v-for="(message, index) in messages" 
             :key="index" 
             class="message"
             :class="message.type">
          <div class="message-content">
            <i v-if="message.type === 'bot'" class="fas fa-robot bot-icon"></i>
            <div class="message-text" v-html="formatMessage(message.text)"></div>
          </div>
          <small class="message-time">{{ formatTime(message.timestamp) }}</small>
        </div>
        <div v-if="isTyping" class="message bot">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="suggested-questions" v-if="showSuggestions">
          <div class="suggestions-title">Câu hỏi thường gặp:</div>
          <div class="suggestions-list">
            <button 
              v-for="(suggestion, index) in currentSuggestions" 
              :key="index"
              class="suggestion-btn"
              @click="handleSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input">
        <input 
          type="text" 
          v-model="userInput"
          @keyup.enter="sendMessage"
          placeholder="Nhập tin nhắn..."
          :disabled="isTyping"
        >
        <button @click="sendMessage" :disabled="!userInput || isTyping">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'

export default {
  name: 'ChatBot',
  setup() {
    const isOpen = ref(false)
    const userInput = ref('')
    const messages = ref([])
    const isTyping = ref(false)
    const messageContainer = ref(null)
    const showSuggestions = ref(true)
    const currentSuggestions = ref([])

    // Thêm hàm determineTopic
    const determineTopic = (message) => {
      message = message.toLowerCase()
      
      // Mapping các từ khóa với topic
      const topicKeywords = {
        'laptop': ['laptop', 'macbook', 'gaming', 'máy tính'],
        'điện thoại': ['điện thoại', 'iphone', 'samsung', 'xiaomi', 'oppo'],
        'thanh toán': ['thanh toán', 'trả góp', 'banking', 'tiền'],
        'bảo hành': ['bảo hành', 'sửa chữa', 'bảo trì', 'đổi trả'],
        'khuyến mãi': ['khuyến mãi', 'giảm giá', 'ưu đãi', 'sale']
      }
      
      // Kiểm tra message có chứa từ khóa của topic nào
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => message.includes(keyword))) {
          return topic
        }
      }
      
      return 'general'
    }
    
    // Thêm hàm getSuggestions
    const getSuggestions = (topic) => {
      const suggestions = {
        'general': [
          'Cửa hàng có những sản phẩm gì?',
          'Chính sách bảo hành như thế nào?',
          'Có hỗ trợ trả góp không?',
          'Thời gian giao hàng mất bao lâu?'
        ],
        'laptop': [
          'Laptop gaming giá bao nhiêu?',
          'Có Macbook không?',
          'Laptop văn phòng giá rẻ?',
          'Có trả góp laptop không?'
        ],
        'điện thoại': [
          'iPhone mới nhất giá bao nhiêu?',
          'Có Samsung Galaxy không?',
          'Điện thoại tầm 5-10 triệu?',
          'Xiaomi có những mẫu nào?'
        ],
        'thanh toán': [
          'Có những hình thức thanh toán nào?',
          'Điều kiện trả góp thế nào?',
          'Có hỗ trợ chuyển khoản không?',
          'Thủ tục trả góp cần gì?'
        ],
        'bảo hành': [
          'Thời gian bảo hành bao lâu?',
          'Địa điểm bảo hành ở đâu?',
          'Chính sách đổi trả thế nào?',
          'Bảo hành có mất phí không?'
        ],
        'khuyến mãi': [
          'Có chương trình khuyến mãi nào?',
          'Ưu đãi sinh viên thế nào?',
          'Giảm giá theo combo?',
          'Có voucher giảm giá không?'
        ]
      }
      
      return suggestions[topic] || suggestions['general']
    }

    // Khởi tạo với suggestions mặc định
    onMounted(() => {
      currentSuggestions.value = getSuggestions('general')
    })

    // Tự động cuộn xuống tin nhắn mới
    watch(messages, () => {
      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      })
    })

    const toggleChat = () => {
      isOpen.value = !isOpen.value
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatMessage = (text) => {
      return text
    }

    const sendMessage = async () => {
      if (!userInput.value || isTyping.value) return

      // Thêm tin nhắn người dùng
      messages.value.push({
        type: 'user',
        text: userInput.value,
        timestamp: new Date()
      })

      const userQuestion = userInput.value
      userInput.value = ''
      isTyping.value = true

      try {
        // Gọi API AI của bạn
        const response = await axios.post('http://localhost:3000/api/ai/chat', {
          message: userQuestion
        })

        // Thêm tin nhắn từ AI
        messages.value.push({
          type: 'bot',
          text: response.data.reply,
          timestamp: new Date()
        })
      } catch (error) {
        messages.value.push({
          type: 'bot',
          text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
          timestamp: new Date()
        })
      } finally {
        isTyping.value = false
      }
    }

    const handleSuggestion = (suggestion) => {
      userInput.value = suggestion
      sendMessage()
      showSuggestions.value = false
    }

    // Cập nhật suggestions dựa trên context
    watch(messages, (newMessages) => {
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.type === 'bot') {
          const topic = determineTopic(lastMessage.text)
          currentSuggestions.value = getSuggestions(topic)
          showSuggestions.value = true
        }
      }
    })

    return {
      isOpen,
      userInput,
      messages,
      isTyping,
      messageContainer,
      toggleChat,
      sendMessage,
      formatTime,
      formatMessage,
      showSuggestions,
      currentSuggestions,
      handleSuggestion
    }
  }
}
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
}

/* Nút chat */
.chat-toggle-btn {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2563eb, #3b82f6);
  border: none;
  color: white;
  box-shadow: 0 4px 25px rgba(37, 99, 235, 0.25);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.chat-toggle-btn:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 30px rgba(37, 99, 235, 0.35);
}

.chat-toggle-btn i {
  font-size: 1.5rem;
  position: relative;
  z-index: 2;
}

.chat-toggle-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1d4ed8, #2563eb);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chat-toggle-btn:hover::after {
  opacity: 1;
}

/* Cửa sổ chat */
.chat-window {
  position: absolute;
  bottom: 85px;
  right: 0;
  width: 400px;
  height: 600px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  backdrop-filter: blur(10px);
}

.chatbot-open .chat-window {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: all;
}

/* Header */
.chat-header {
  padding: 24px;
  background: linear-gradient(145deg, #2563eb, #3b82f6);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.chat-subtitle {
  opacity: 0.9;
  font-size: 0.9rem;
  font-weight: 400;
}

/* Messages Container */
.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f8fafc;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Message Bubbles */
.message {
  margin-bottom: 20px;
  max-width: 85%;
  animation: messageSlideIn 0.3s ease forwards;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  margin-left: auto;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.bot-icon {
  color: #2563eb;
  font-size: 1.25rem;
  padding: 8px;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 50%;
}

.message-text {
  padding: 14px 18px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
  line-height: 1.5;
}

.message.user .message-text {
  background: #2563eb;
  color: white;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.15);
}

.message-time {
  display: block;
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.75rem;
  margin-left: 44px;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 16px 20px;
  background: white;
  border-radius: 18px;
  width: fit-content;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* Input Area */
.chat-input {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  position: relative;
}

.chat-input::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(37, 99, 235, 0.1), transparent);
}

.chat-input input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.chat-input input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: white;
}

.chat-input button {
  padding: 14px 24px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(145deg, #2563eb, #3b82f6);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.chat-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .chat-window {
    background: rgba(30, 41, 59, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
  
  .chat-messages {
    background: #0f172a;
  }
  
  .message-text {
    background: #1e293b;
    color: #f1f5f9;
  }
  
  .message.user .message-text {
    background: #2563eb;
  }
  
  .chat-input {
    background: #1e293b;
    border-top-color: #334155;
  }
  
  .chat-input input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
  
  .chat-input input:focus {
    background: #1e293b;
    border-color: #2563eb;
  }
  
  .typing-indicator {
    background: #1e293b;
  }
  
  .bot-icon {
    background: rgba(37, 99, 235, 0.2);
  }
}

/* Responsive Design */
@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    bottom: 90px;
  }
  
  .chat-toggle-btn {
    width: 55px;
    height: 55px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .chat-input {
    padding: 16px;
  }
  
  .chat-input button {
    padding: 12px 16px;
  }
}

/* Suggested Questions Styling */
.suggested-questions {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease;
}

.suggestions-title {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 12px;
  font-weight: 500;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-btn:hover {
  background: #f8fafc;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .suggested-questions {
    background: rgba(30, 41, 59, 0.8);
  }
  
  .suggestions-title {
    color: #94a3b8;
  }
  
  .suggestion-btn {
    background: #1e293b;
    border-color: #334155;
    color: #60a5fa;
  }
  
  .suggestion-btn:hover {
    background: #334155;
    border-color: #60a5fa;
  }
}

/* Responsive Design */
@media (max-width: 480px) {
  .suggestions-list {
    flex-direction: column;
  }
  
  .suggestion-btn {
    width: 100%;
    text-align: left;
  }
}
</style> 