require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// إعداد البوت
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// قائمة الصلاحيات المعتمدة
const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),      // معرف المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // معرف أستاذة آلاء (1036943414)
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

/**
 * HORUS_PROMPT: الميثاق الاستراتيجي لحورس الرقمي
 */
const HORUS_PROMPT = `
ROLE: HORUS (حورس الرقمي) - The Executive Intelligence of EchoWave Media Group LTD.
VIBE: Majestic, Insightful, Professional, and Decisive.

CORE IDENTITY:
- You are the "Digital Eye" that guards and grows the "Digital Legacy" of clients.
- You represent ONLY EchoWave Media Group LTD.
- Style: Elegant Egyptian Business Slang & High-end British Executive English.

COMMUNICATION:
1. Always start with "السلام عليكم" + Name (Amr / Alaa) in the first message.
2. Use the 👁️ symbol to represent strategic insight.
3. If asked about services, tell them to use /services to see the interactive menu.
`;

// 🏛️ هيكل الخدمات المنظم
const services = {
  main: {
    text: "👁️ *بصيرة حورس تشمل القطاعات التالية، اختر وجهتك لنرسم المسار:*",
    buttons: [
      [{ text: "1️⃣ البراندنج والهوية 🏛️", callback_data: 'service_branding' }],
      [{ text: "2️⃣ السوشيال ميديا والتسويق 📈", callback_data: 'service_social' }],
      [{ text: "3️⃣ البرمجيات والتطبيقات 💻", callback_data: 'service_tech' }],
      [{ text: "🔍 طلب تحليل مجاني لمشروعك 👁️", callback_data: 'free_audit' }],
      [{ text: "📞 تواصل مباشر مع الإدارة", callback_data: 'contact_human' }]
    ]
  },
  audit: {
    text: "👁️ *خدمة التحليل المجاني من حورس:*\n\nيسعدنا فحص منصاتكم الحالية لاكتشاف فجوات النمو. فضلاً، قم بإرسال رسالة واحدة تشمل:\n\n1. رابط الموقع الإلكتروني.\n2. روابط منصات التواصل.\n3. رقم الواتساب.\n\n*سيبدأ حورس فوراً في استبصار المسار وإبلاغ الإدارة.*",
    buttons: [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]]
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 🛡️ حماية النظام
  if (!AUTHORIZED_USERS.includes(chatId)) {
    return bot.sendMessage(chatId, "⚠️ عذراً، هذا النظام مخصص للعمليات التنفيذية لشركة إيكو ويف ميديا جروب فقط.");
  }

  if (!chatContext[chatId]) chatContext[chatId] = [];
  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  // 1. أوامر الخدمات والبداية
  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\n👁️ *حورس الرقمي* في وضع الاستعداد. بصيرة *EchoWave* جاهزة لرسم مسار التميز لمشاريعنا.\n\nاستخدم /services لاستعراض قطاعاتنا.`, { parse_mode: 'Markdown' });
  }

  if (userText && (userText.includes('خدمات') || userText === '/services')) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2. التقاط بيانات التحليل المجاني (Lead Capture)
  if (userText && (userText.includes('http') || userText.includes('www') || (userText.length > 8 && !isNaN(userText)))) {
    // إرسال تنبيه للمهندس عمرو فوراً
    bot.sendMessage(process.env.CHAT_ID, `🚨 *تنبيه حورس:* عميل جديد أرسل بيانات للتحليل!\n\n*البيانات:* \n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'بدون يوزر'})`, { parse_mode: 'Markdown' });
    
    return bot.sendMessage(chatId, "👁️ *تم استلام البيانات بنجاح.*\n\nحورس يستبصر الآن مواطن القوة والضعف في روابطكم. سيتواصل معكم المهندس عمرو أو أحد مستشارينا قريباً.");
  }

  // 3. المحادثة الذكية مع حورس
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      if (chatContext[chatId].length > 12) chatContext[chatId].shift();

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: HORUS_PROMPT }, ...chatContext[chatId]],
          temperature: 0.65
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });
    } catch (err) {
      bot.sendMessage(chatId, `السلام عليكم ${userName}، حورس يمر بتحديث لحظي، نعود للخدمة فوراً.`);
    }
  }
});

// 🧠 معالجة الأزرار التفاعلية (Inline Buttons)
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } else if (action === 'free_audit') {
    bot.editMessageText(services.audit.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.audit.buttons } });
  } else if (action === 'contact_human') {
    const contactText = `👁️ لإتمام التعاقد أو الحصول على استشارة استراتيجية فورية، يمكنك التواصل مباشرة مع الإدارة التنفيذية لـ *EchoWave*:

📱 *المهندس عمرو:* 01144408455

📍 [تحدث معنا عبر واتساب مباشرة](https://wa.me/201144408455)`;
    
    bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
  } else {
    bot.answerCallbackQuery(callbackQuery.id, { text: "سيتم تفعيل هذا القسم بالتفصيل قريباً 👁️" });
  }
});

console.log('👁️ HORUS DIGITAL CORE — Online and Secure.');
