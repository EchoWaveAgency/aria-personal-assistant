require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// معرفات الإدارة لاستلام التنبيهات
const ADMIN_IDS = [
  String(process.env.CHAT_ID),      // المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // الأستاذة آلاء
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ هيكل البيانات والخدمات
const services = {
  main: {
    text: "👁️ *مرحباً بك في محراب حورس الرقمي.*\n\nأنا بصيرتك الاستراتيجية في *EchoWave*. لقد جئت لهندسة سيادتك الرقمية وتحويل رؤيتك إلى إرث ملموس.\n\nاختر مسار القوة:",
    buttons: [
      [{ text: "🏛️ هندسة البراندنج (High-End)", callback_data: 'form_branding' }],
      [{ text: "📈 السيطرة على السوشيال ميديا", callback_data: 'form_social' }],
      [{ text: "💻 الأنظمة الذكية والـ AI", callback_data: 'form_tech' }],
      [{ text: "👁️ استبصار مجاني لمشروعك", callback_data: 'form_audit' }],
      [{ text: "📞 تواصل مباشر مع القيادة", callback_data: 'contact_human' }]
    ]
  },
  forms: {
    branding: "🏛️ *لقطاع البراندنج:*\nأرسل بياناتك التالية ليبدأ حورس في رسم هويتك:\n1. الاسم.\n2. رقم الواتساب.\n3. اسم المشروع.\n4. ميزانية الاستثمار التقريبية.",
    social: "📈 *لقطاع السوشيال ميديا:*\nأرسل بياناتك لتحويل منصاتك إلى ماكينة مبيعات:\n1. الاسم.\n2. رقم الواتساب.\n3. هدفك الرئيسي.",
    tech: "💻 *لقطاع البرمجيات والـ AI:*\nأرسل متطلباتك التقنية:\n1. الاسم.\n2. رقم الواتساب.\n3. وصف النظام المطلوب.",
    audit: "🔍 *لطلب التحليل الاستراتيجي:*\nأرسل رابط موقعك، وسيقوم حورس بتحليل نقاط القوة والضعف:\n1. الاسم.\n2. رقم الواتساب.\n3. الرابط المراد تحليله."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!chatContext[chatId]) chatContext[chatId] = [];

  if (userText === '/start' || userText === '/services' || (userText && userText.includes('خدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // التقاط البيانات (Leads)
  const isLead = userText && (userText.includes('@') || /^\+?[0-9]{10,15}$/.test(userText.replace(/\s/g, '')));
  if (isLead) {
    const adminAlert = `🚨 *New Lead Captured:*\n\n${userText}\n\n*User:* ${msg.from.first_name} (@${msg.from.username || 'N/A'})`;
    ADMIN_IDS.forEach(id => id && bot.sendMessage(id, adminAlert, { parse_mode: 'Markdown' }));
    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بعناية. سنتواصل معكم عبر الواتساب قريباً.*");
  }

  // الرد بالذكاء الاصطناعي
  if (userText && !userText.startsWith('/')) {
    try {
      const thinking = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: "Role: HORUS. Identity: Strategic AI Lead for EchoWave. Tone: Elite, Authoritative, Egyptian-inspired. Goal: Convert to sales. Ask for WhatsApp." },
          ...chatContext[chatId].slice(-5)
        ],
        temperature: 0.6
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } });

      await bot.deleteMessage(chatId, thinking.message_id);
      const reply = response.data.choices[0].message.content;
      bot.sendMessage(chatId, reply, { 
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "👁️ ابدأ استراتيجيتك الآن", callback_data: 'form_audit' }]] }
      });
      chatContext[chatId].push({ role: 'assistant', content: reply });
    } catch (err) { console.error(err); }
  }
});

bot.on('callback_query', (query) => {
  const action = query.data;
  const chatId = query.message.chat.id;
  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } else if (action.startsWith('form_')) {
    bot.editMessageText(services.forms[action.replace('form_', '')], { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: "⬅️ العودة", callback_data: 'main_menu' }]] } });
  } else if (action === 'contact_human') {
    bot.sendMessage(chatId, "👁️ للتواصل المباشر مع المهندس عمرو: https://wa.me/201144408455", { parse_mode: 'Markdown' });
  }
  bot.answerCallbackQuery(query.id);
});
