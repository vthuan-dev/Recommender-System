const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const hf = new HfInference(process.env.HF_API_KEY);

// Database các câu hỏi và câu trả lời
const qaDatabase = {
  // 1. Chào hỏi & Giới thiệu
  'xin chào': ['Xin chào!', 'Chào bạn!', 'Xin chào, tôi có thể giúp gì cho bạn?'],
  'hi': ['Hi bạn!', 'Chào bạn!', 'Xin chào, bạn cần giúp gì không?'],
  'tạm biệt': ['Tạm biệt bạn!', 'Hẹn gặp lại!', 'Chúc bạn một ngày tốt lành!'],
  'bạn là ai': ['Tôi là trợ lý ảo của T-Store, tôi có thể giúp bạn tìm hiểu về sản phẩm và dịch vụ của chúng tôi'],
  
  // 2. Thông tin chung về cửa hàng
  'cửa hàng': {
    'general': 'T-Store là cửa hàng công nghệ uy tín với nhiều năm kinh nghiệm',
    'địa chỉ': 'Địa chỉ cửa hàng: 123 Đường ABC, Quận XYZ, TP.HCM',
    'giờ làm việc': 'Cửa hàng mở cửa từ 8h00 - 22h00 các ngày trong tuần',
    'liên hệ': 'Bạn có thể liên hệ qua hotline: 1900xxxx hoặc email: support@tstore.com'
  },

  // 3. Sản phẩm
  'laptop': {
    'general': 'T-Store có nhiều laptop từ các thương hiệu như Dell, HP, Lenovo',
    'gaming': 'Các laptop gaming hot: MSI GF63, ASUS ROG, Acer Nitro 5',
    'văn phòng': 'Laptop văn phòng phổ biến: Dell Inspiron, HP Pavilion, Lenovo ThinkPad',
    'macbook': 'Có các dòng MacBook Air M1/M2, MacBook Pro 14/16 inch',
    'giá': {
      'dưới 15': 'Laptop học tập cơ bản: Acer Aspire, Asus VivoBook từ 10-15 triệu',
      '15-25': 'Laptop đồ họa, gaming tầm trung: Dell Gaming G15, HP Victus từ 15-25 triệu',
      'trên 25': 'Laptop cao cấp: MacBook Pro, Dell XPS, gaming cao cấp từ 25-50 triệu'
    }
  },

  'điện thoại': {
    'general': 'Đa dạng điện thoại từ phổ thông đến cao cấp',
    'iphone': 'iPhone 13/14/15 series, giá từ 15-45 triệu',
    'samsung': 'Samsung Galaxy S23, Z Fold5, A series giá từ 4-45 triệu',
    'xiaomi': 'Xiaomi Redmi Note 12, POCO series giá từ 3-15 triệu',
    'oppo': 'OPPO Reno10, Find N3 series giá từ 7-45 triệu',
    'giá': {
      'dưới 5': 'Realme C55, Redmi 12C, Samsung Galaxy A14',
      '5-10': 'Redmi Note 12, OPPO A78, Samsung A34',
      '10-15': 'iPhone 11, Samsung S21 FE, OPPO Reno10',
      'trên 15': 'iPhone 15 series, Samsung S23, Z Fold5'
    }
  },

  // 4. Thanh toán & Đơn hàng
  'thanh toán': {
    'general': 'Nhiều phương thức thanh toán: tiền mặt, chuyển khoản, thẻ tín dụng',
    'trả góp': 'Hỗ trợ trả góp 0% qua thẻ tín dụng hoặc CMND + Hộ khẩu',
    'banking': 'Chấp nhận thanh toán qua các ngân hàng lớn và ví điện tử',
    'hóa đơn': 'Xuất hóa đơn VAT theo yêu cầu'
  },

  'đơn hàng': {
    'general': 'Theo dõi đơn hàng qua email hoặc số điện thoại',
    'trạng thái': 'Kiểm tra trạng thái đơn hàng trong mục Đơn hàng của tài khoản',
    'hủy đơn': 'Có thể hủy đơn hàng trong vòng 24h nếu chưa giao',
    'thời gian': 'Giao hàng trong 1-3 ngày tùy khu vực'
  },

  // 5. Chính sách & Dịch vụ
  'bảo hành': {
    'general': 'Bảo hành chính hãng 12-24 tháng',
    'địa điểm': 'Bảo hành tại cửa hàng hoặc trung tâm bảo hành hãng',
    'quy trình': 'Kiểm tra và thông báo thời gian sửa chữa trong 24h',
    'chi phí': 'Miễn phí trong thời gian bảo hành'
  },

  'đổi trả': {
    'general': 'Đổi trả miễn phí trong 30 ngày',
    'điều kiện': 'Sản phẩm còn nguyên vẹn, đầy đủ phụ kiện',
    'quy trình': 'Liên hệ hotline hoặc mang trực tiếp đến cửa hàng',
    'hoàn tiền': 'Hoàn tiền trong 24h qua phương thức thanh toán ban đầu'
  },

  // 6. Khuyến mãi & Ưu đãi
  'khuyến mãi': {
    'general': 'Cập nhật khuyến mãi mới nhất tại tstore.com/khuyen-mai',
    'sinh nhật': 'Giảm thêm 5% cho khách hàng trong tháng sinh nhật',
    'học sinh': 'Giảm 5% cho học sinh, sinh viên có thẻ',
    'combo': 'Giảm thêm khi mua combo sản phẩm'
  },

  // 7. Tài khoản & Thành viên
  'tài khoản': {
    'general': 'Đăng ký tài khoản để tích điểm và nhận ưu đãi',
    'đăng ký': 'Đăng ký nhanh với email hoặc số điện thoại',
    'điểm thưởng': 'Tích 1 điểm cho mỗi 100,000đ chi tiêu',
    'hạng thành viên': 'Silver, Gold, Platinum với ưu đãi tăng dần'
  },

  // Default response
  'default': 'Xin lỗi, bạn có thể nói rõ hơn được không? Tôi có thể tư vấn về sản phẩm, đơn hàng, bảo hành và các dịch vụ khác.'
};

function findBestResponse(userMessage, context) {
  userMessage = userMessage.toLowerCase();
  
  // Xử lý các từ khóa đồng nghĩa
  const synonyms = {
    'giá bao nhiêu': 'giá',
    'bao nhiêu tiền': 'giá',
    'mua trả góp': 'trả góp',
    'bảo trì': 'bảo hành',
    'giao hàng': 'đơn hàng',
    'ship': 'đơn hàng',
    'sale': 'khuyến mãi',
    'discount': 'khuyến mãi'
  };

  // Thay thế từ đồng nghĩa
  Object.entries(synonyms).forEach(([key, value]) => {
    userMessage = userMessage.replace(key, value);
  });
  
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

const userContexts = new Map();

router.post('/chat', async (req, res) => {
  const { message, userId } = req.body;
  
  // Lấy context của user
  let context = userContexts.get(userId) || {
    lastTopic: null,
    questionCount: 0
  };

  // Cập nhật context
  context.questionCount++;
  
  // Tìm câu trả lời dựa trên context
  let reply = findBestResponse(message, context);
  
  // Lưu context
  userContexts.set(userId, context);
  
  res.json({ reply, isBot: true });
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

function getSuggestions(topic) {
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
  };
  
  return suggestions[topic] || suggestions['general'];
}

module.exports = router; 