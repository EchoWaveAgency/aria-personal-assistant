require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),
  String(process.env.ALAA_CHAT_ID)
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ هيكل الخدمات المحدث مع خيار التحليل المجاني
const services = {
  main: {
    text: "بصيرة *حورس* تشمل القطاعات التالية، اختر وجهتك لنرسم المسار:",
    buttons: [
      [{ text: "1️⃣ البراندنج والهوية 🏛️", callback_data: 'service_branding' }],
      [{ text: "2️⃣ السوشيال ميديا والتسويق 📈", callback_data: 'service_social' }],
      [{ text: "3️⃣ البرمجيات والتطبيقات 💻", callback_data: 'service_tech' }],
      [{ text: "🔍 طلب تحليل مجاني لمشروعك 👁️", callback_data: 'free_audit' }],
      [{ text: "📞 تواصل مباشر مع الإدارة", callback_data: 'contact_human' }]
    ]
  },
  audit: {
    text: "👁️ *خدمة التحليل المجاني من حورس:*\n\nيسعدنا فحص منصاتكم الحالية لاكتشاف فجوات النمو. فضلاً، قم بإرسال الرسالة التالية شاملة:\n\n1. رابط الموقع الإلكتروني.\n2. روابط منصات التواصل (فيسبوك/إنستجرام).\n3. رقم الواتساب للتواصل.\n\n*بمجرد الإرسال، سيبدأ حورس في استبصار المسار وإرسال تقرير أولي لسيادتكم.*",
    buttons: [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]]
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;
  if (!chatContext[chatId]) chatContext[chatId] = [];

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  // تفعيل قائمة الخدمات
  if (userText && (userText.includes('خدمات') || userText === '/services')) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // كشف لو العميل بعت روابط أو بيانات تحليل (Lead Capture)
  if (userText && (userText.includes('http') || userText.includes('www') || userText.includes('01'))) {
    bot.sendMessage(process.env.CHAT_ID, `🚨 *تنبيه حورس:* عميل جديد طلب تحليلاً مجانياً!\n\n*البيانات المرسلة:*\n${userText}\n\n*من الحساب:* ${msg.from.first_name} (@${msg.from.username || 'بدون يوزر'})`, { parse_mode: 'Markdown' });
    
    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بنجاح.*\n\nجاري الآن فحص الروابط وبناء تقرير أولي حول 'إرث العلامة التجارية' الخاص بكم. سيتواصل معكم أحد مستشارينا قريباً.");
  }

  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\n👁️ *حورس الرقمي* في وضع الاستعداد. بصيرة *EchoWave* جاهزة. هل تود استعراض /services أم نبدأ بـ *تحليل مجاني* لمشروعك الحالي؟`, { parse_mode: 'Markdown' });
  }

  // المحادثة العادية مع AI
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      if (chatContext[chatId].length > 10) chatContext[chatId].shift();

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: "ROLE: HORUS Digital Horus. Professional, Elite Egyptian Slang. Mention Digital Legacy." }, ...chatContext[chatId]],
          temperature: 0.6
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });
    } catch (err) { console.error(err); }
  }
});

// 🧠 معالجة الضغط على الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } else if (action === 'free_audit') {
    bot.editMessageText(services.audit.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.audit.buttons } });
  } else if (action === 'contact_human') {
    bot.sendMessage(chatId, "👁️ لترتيب جلسة استراتيجية مباشرة مع الإدارة التنفيذية لـ *EchoWave*، يرجى التواصل عبر:\n\n📍 [رابط واتساب المهندس عمرو]");
  }
});
