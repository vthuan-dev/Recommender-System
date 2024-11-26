const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

// Khởi tạo Hugging Face với API key từ .env
const hf = new HfInference(process.env.HF_API_KEY);

// Danh sách các mô hình miễn phí phổ biến
const MODELS = {
  TEXT_GENERATION: 'gpt2',
  CONVERSATION: 'facebook/blenderbot-400M-distill',
  QUESTION_ANSWERING: 'deepset/roberta-base-squad2',
};

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Sử dụng mô hình conversation
    const response = await hf.conversational({
      model: MODELS.CONVERSATION,
      inputs: {
        text: message,
      },
    });

    res.json({ 
      reply: response.generated_text,
      model: MODELS.CONVERSATION 
    });

  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Fallback to basic response if API fails
    const fallbackResponses = {
      'xin chào': 'Xin chào! Tôi có thể giúp gì cho bạn?',
      'sản phẩm': 'T-Store có nhiều sản phẩm công nghệ như điện thoại, laptop, tablet và phụ kiện.',
      'giá': 'Giá sản phẩm của chúng tôi rất cạnh tranh. Bạn quan tâm đến sản phẩm nào?',
      'default': 'Xin lỗi, tôi đang gặp sự cố kết nối. Bạn có thể thử lại sau?'
    };

    let fallbackReply = fallbackResponses.default;
    for (let key in fallbackResponses) {
      if (message.toLowerCase().includes(key)) {
        fallbackReply = fallbackResponses[key];
        break;
      }
    }

    res.json({ 
      reply: fallbackReply,
      isFailover: true 
    });
  }
});

module.exports = router; 