const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const hf = new HfInference(process.env.HF_API_KEY);

// Database các câu hỏi và câu trả lời
const qaDatabase = {
  // Chào hỏi
  'xin chào': ['Xin chào!', 'Chào bạn!', 'Xin chào, tôi có thể giúp gì cho bạn?'],
  'hi': ['Hi bạn!', 'Chào bạn!', 'Xin chào, bạn cần giúp gì không?'],
  
  // Laptop
  'laptop': {
    'general': 'T-Store có nhiều laptop từ các thương hiệu như Dell, HP, Lenovo.',
    'gaming': 'Chúng tôi có các laptop gaming từ các hãng MSI, ASUS ROG, Acer Predator.',
    'văn phòng': 'Có nhiều laptop văn phòng mỏng nhẹ từ Dell, HP, Lenovo.',
    'giá': {
      'dưới 15': 'Có các model laptop học tập, văn phòng cơ bản từ 10-15 triệu.',
      '15-25': 'Có các laptop tầm trung đa năng từ 15-25 triệu.',
      'trên 25': 'Có các laptop cao cấp, gaming từ 25-50 triệu.'
    }
  },
  
  // Điện thoại
  'điện thoại': {
    'general': 'T-Store có đa dạng điện thoại từ nhiều thương hiệu.',
    'iphone': 'Chúng tôi có các đời iPhone từ 11 đến 15 Pro Max.',
    'samsung': 'Có các dòng Samsung Galaxy S, A và Z Fold.',
    'giá': {
      'dưới 5': 'Có các điện thoại phổ thông từ Samsung, Xiaomi dưới 5 triệu.',
      '5-15': 'Có các điện thoại tầm trung đến cao cấp từ 5-15 triệu.',
      'trên 15': 'Có các flagship mới nhất trên 15 triệu.'
    }
  },

  // Dịch vụ
  'bảo hành': 'Sản phẩm được bảo hành 12-24 tháng tùy loại.',
  'trả góp': 'Hỗ trợ trả góp 0% qua nhiều ngân hàng.',
  'đổi trả': 'Đổi trả miễn phí trong 30 ngày đầu.',
  
  // Default
  'default': 'Xin lỗi, bạn có thể nói rõ hơn được không?'
};

function findBestResponse(userMessage) {
  // Chuyển sang chữ thường để so sánh
  userMessage = userMessage.toLowerCase();
  
  // Kiểm tra từng từ khóa
  for (const [key, value] of Object.entries(qaDatabase)) {
    if (userMessage.includes(key)) {
      // Nếu là object (có sub-categories)
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Xử lý câu hỏi về giá
        if (userMessage.includes('giá')) {
          if (userMessage.includes('rẻ') || userMessage.includes('thấp')) {
            return value.giá['dưới 5'] || value.giá['dưới 15'];
          } else if (userMessage.includes('cao')) {
            return value.giá['trên 15'] || value.giá['trên 25'];
          }
          // Trả về thông tin chung về giá
          return `${value.general} Về giá cả, ${value.giá['dưới 5'] || value.giá['dưới 15']} ${value.giá['5-15'] || value.giá['15-25']} ${value.giá['trên 15'] || value.giá['trên 25']}`;
        }
        
        // Xử lý các sub-category khác
        for (const [subKey, subValue] of Object.entries(value)) {
          if (userMessage.includes(subKey) && typeof subValue === 'string') {
            return subValue;
          }
        }
        
        // Nếu không match sub-category, trả về thông tin general
        return value.general;
      }
      
      // Nếu là array, chọn ngẫu nhiên một câu trả lời
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      
      // Nếu là string, trả về trực tiếp
      return value;
    }
  }
  
  // Nếu không tìm thấy match, trả về câu mặc định
  return qaDatabase.default;
}

// Hàm mới để gọi VietAI
async function getVietAIResponse(message) {
  try {
    const response = await hf.textGeneration({
      model: 'VietAI/gpt-neo-1.3B-vietnamese-news',
      inputs: `Hãy trả lời như một nhân viên bán hàng công nghệ chuyên nghiệp: ${message}`,
      parameters: {
        max_length: 100,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    });
    return response.generated_text;
  } catch (error) {
    console.error('VietAI Error:', error);
    return null;
  }
}

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Bước 1: Thử tìm câu trả lời từ database
    let reply = findBestResponse(message);

    // Bước 2: Nếu không tìm thấy câu trả lời phù hợp từ database, 
    // thử dùng VietAI
    if (reply === qaDatabase.default) {
      try {
        const aiReply = await getVietAIResponse(message);
        if (aiReply && aiReply.length > 10) { // Kiểm tra câu trả lời có ý nghĩa
          reply = aiReply;
        }
      } catch (error) {
        console.error('AI Error:', error);
        // Giữ nguyên reply từ database nếu AI fails
      }
    }

    // Đảm bảo reply luôn là string
    res.json({ 
      reply: typeof reply === 'string' ? reply : qaDatabase.default,
      isBot: true
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ 
      reply: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
      isError: true 
    });
  }
});

// Thêm endpoint để kiểm tra trạng thái AI
router.get('/status', async (req, res) => {
  try {
    // Thử một câu đơn giản để kiểm tra kết nối
    const response = await getVietAIResponse('xin chào');
    res.json({ 
      status: 'ok',
      aiAvailable: true
    });
  } catch (error) {
    res.json({ 
      status: 'ok',
      aiAvailable: false,
      message: 'AI service not available, falling back to database responses'
    });
  }
});

module.exports = router; 