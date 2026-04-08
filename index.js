require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// معرفات الإدارة لاستلام التنبيهات
const ADMIN_IDS = [
  String(process.env.CHAT_ID),      // ID المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // ID الأستاذة آلاء
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ مصفوفة الخدمات والتفاصيل بهوية "حورس" المطورة
const services = {
  main: {
    text: "👁️ *مرحباً بك في أروقة حورس الرقمي.*\n\nأنا الذكاء الاستراتيجي لـ *EchoWave*. بصيرتي مصممة لهندسة سيطرتكم الرقمية وتحويل رؤيتكم إلى إرث ملموس.\n\nاختر مسار نموك الآن:",
    buttons: [
      [{ text: "🏛️ هندسة البراندنج (High-End)", callback_data: 'form_branding' }],
      [{ text: "📈 السيطرة على السوشيال ميديا", callback_data: 'form_social' }],
      [{ text: "💻 تطوير النظم والـ AI", callback_data: 'form_tech' }],
      [{ text: "👁️ استبصار مجاني لمشروعك (Audit)", callback_data: 'form_audit' }],
      [{ text: "📞 تواصل مباشر مع القيادة", callback_data: 'contact_human' }]
    ]
  },
  forms: {
    branding: "🏛️ *لقطاع البراندنج (Branding Strategy):*\nأرسل بياناتك التالية في رسالة واحدة ليبدأ حورس في رسم هويتك:\n\n1. الاسم.\n2. رقم الواتساب.\n3. اسم المشروع.\n4. ميزانية الاستثمار التقريبية.",
    social: "📈 *لقطاع السوشيال ميديا (Growth):*\nأرسل بياناتك لتحويل منصاتك إلى ماكينة مبيعات:\n\n1. الاسم.\n2. رقم الواتساب.\n3. روابط المنصات الحالية.\n4. هدفك الرئيسي (مبيعات / وعي بالعلامة).",
    tech: "💻 *لقطاع البرمجيات والـ AI:*\nأرسل متطلباتك التقنية لنبني لك نظاماً ذكياً:\n\n1. الاسم.\n2. رقم الواتساب.\n3. وصف مختصر للنظام المطلوب.\n4. هل تحتاج دمج ذكاء اصطناعي (AI Integration)؟",
    audit: "🔍 *لطلب التحليل الاستراتيجي (Free Audit):*\nأرسل رابط موقعك أو منصتك، وسيقوم حورس بتحليل نقاط القوة والضعف:\n\n1. الاسم.\n2. رقم الواتساب.\n3. الرابط المراد تحليله."
  },
  details: {
    branding: "👁️ *هندسة الهوية:*\nنحن لا نصمم شعارات، نحن نصنع 'Legacy'. نبني استراتيجية بصرية ونفسية تجعل علامتك التجارية هي الخيار الوحيد في ذهن العميل.",
    social: "👁️ *السيطرة الرقمية:*\nإدارة محتوى cinematic وحملات ممولة مبنية على الـ Data، تضمن لك أعلى عائد على الاستثمار (ROI).",
    tech: "👁️ *الأنظمة الذكية:*\nتطوير مواقع Next.js فائقة السرعة، وتطبيقات، ودمج أدوات AI لأتمتة أعمالك بالكامل."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!chatContext[chatId]) chatContext[chatId] = [];

  // 1️⃣ الأوامر الرئيسية
  if (userText === '/start' || userText === '/services' || (userText && (userText.includes('خدمات') || userText.includes('الرئيسية')))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2️⃣ نظام التقاط البيانات الذكي (Lead Capture System)
  const cleanText = userText ? userText.replace(/\s/g, '') : '';
  const isPhone = /^\+?[0-9]{10,15}$/.test(cleanText);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText);
  const hasLeadInfo = userText && (userText.includes('@') || userText.includes('واتساب') || isPhone || isEmail);

  if (hasLeadInfo) {
    const adminAlert = `🚨 *تنبيه حورس (New Lead Captured):*\n\n*البيانات الواردة:*\n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'N/A'})`;
    
    ADMIN_IDS.forEach(adminId => {
      if(adminId) bot.sendMessage(adminId, adminAlert, { parse_mode: 'Markdown' });
    });

    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بعناية.*\n\nسيقوم أحد مستشارينا الاستراتيجيين بمراجعة ملفكم والتواصل عبر الواتساب لتحديد موعد الجلسة الاستشارية.", {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 استكشف خدماتنا بعمق", callback_data: 'show_all_details' }],
          [{ text: "⬅️ العودة للقائمة", callback_data: 'main_menu' }]
        ]
      }
    });
  }

  // 3️⃣ الرد الذكي - محرك المبيعات (Horus AI Sales Engine)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      // الحفاظ على سياق قصير لسرعة الاستجابة
      if (chatContext[chatId].length > 6) chatContext[chatId].shift();

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: `
                ROLE: HORUS (حورس الرقمي). 
                IDENTITY: The Elite Strategic Assistant of EchoWave Media Group. 
                TONE: Professional, Authoritative, Egyptian-inspired, and Mysterious.
                
                GOALS:
                1. Convert visitors into high-ticket clients.
                2. If a user asks a general question, answer briefly and then ask a 'qualifying question' (e.g., "What is the scale of your current project?").
                3. Always push to get their Name and WhatsApp to send a 'Custom Strategy'.
                
                RULES:
                - Never say "I am an AI". You are "Horus Intelligence".
                - Use power words: (Strategize, Dominate, Vision, Legacy, Engineering).
                - If they ask about prices, respond: "We don't offer generic pricing; we engineer investments based on your brand's potential. Shall we discuss your goals over WhatsApp?"
                - Language: Always match the user's language (Arabic or English).
              ` 
            },
            ...chatContext[chatId]
          ],
          temperature: 0.6
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      const aiReply = response.data.choices[0].message.content;
      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      
      bot.sendMessage(chatId, aiReply, { 
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "👁️ احصل على استراتيجية مخصصة", callback_data: 'form_audit' }]
            ]
        }
      });
      
      chatContext[chatId].push({ role: 'assistant', content: aiReply });
    } catch (err) { 
      console.error("AI Error:", err);
      bot.sendMessage(chatId, "👁️ عذراً، هناك تشويش في الترددات الرقمية. حاول مرة أخرى.");
    }
  }
});

// 🧠 التحكم في الأزرار (Callback Queries)
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } 
  else if (action === 'show_all_details') {
    const detailsMenu = [
      [{ text: "🏛️ تفاصيل البراندنج", callback_data: 'detail_branding' }],
      [{ text: "📈 تفاصيل السوشيال ميديا", callback_data: 'detail_social' }],
      [{ text: "💻 تفاصيل البرمجيات", callback_data: 'detail_tech' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ];
    bot.editMessageText("👁️ *اختر القطاع الذي تود استبصار تفاصيله الاستراتيجية:*", { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: detailsMenu } });
  } 
  else if (action.startsWith('detail_')) {
    const type = action.replace('detail_', '');
    bot.editMessageText(services.details[type], { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: "⬅️ عودة للتفاصيل", callback_data: 'show_all_details' }]] } });
  } 
  else if (action.startsWith('form_')) {
    const formType = action.replace('form_', '');
    bot.editMessageText(services.forms[formType], { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: "⬅️ العودة", callback_data: 'main_menu' }]] } });
  } 
  else if (action === 'contact_human') {
    bot.sendMessage(chatId, `👁️ *للتواصل المباشر مع مركز القيادة:*\n\nالمهندس عمرو سيد: 01144408455\n\n[اضغط هنا للتحدث عبر واتساب مباشرة](https://wa.me/201144408455)`, { parse_mode: 'Markdown' });
  }
  
  bot.answerCallbackQuery(callbackQuery.id);
});

console.log("👁️ Horus Intelligence is now active...");
