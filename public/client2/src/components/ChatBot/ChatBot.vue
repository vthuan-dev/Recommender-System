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

    // Khởi tạo với tin nhắn chào
    onMounted(() => {
      messages.value.push({
        type: 'bot',
        text: 'Xin chào! Tôi là T-Store AI Assistant. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date()
      })
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

    return {
      isOpen,
      userInput,
      messages,
      isTyping,
      messageContainer,
      toggleChat,
      sendMessage,
      formatTime,
      formatMessage
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

.chat-toggle-btn {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  border: none;
  color: white;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-toggle-btn:hover {
  transform: scale(1.1);
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.chatbot-open .chat-window {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.chat-header {
  padding: 20px;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  color: white;
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
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.bot-icon {
  color: #1a73e8;
  font-size: 1.2rem;
}

.message-text {
  padding: 12px 16px;
  border-radius: 15px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.message.user .message-text {
  background: #1a73e8;
  color: white;
}

.message-time {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 0.8rem;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 12px 16px;
  background: white;
  border-radius: 15px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #1a73e8;
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
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.chat-input {
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: #1a73e8;
  outline: none;
}

.chat-input button {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.chat-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .chat-window {
    background: #1e293b;
  }
  
  .chat-messages {
    background: #0f172a;
  }
  
  .message-text {
    background: #1e293b;
    color: #f1f5f9;
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
}
</style> 