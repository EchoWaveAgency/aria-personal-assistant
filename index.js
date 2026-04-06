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

// 🏛️ مصفوفة الخدمات
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
  branding: {
    text: "🏛️ *قطاع البراندنج:* صياغة إرث العلامة التجارية.\n\nنحن هنا لنبني هوية بصرية واستراتيجية تدوم طويلاً.",
    buttons: [[{ text: "📞 طلب استشارة براندنج", callback_data: 'contact_human' }], [{ text: "⬅️ العودة", callback_data: 'main_menu' }]]
  },
  social: {
    text: "📈 *السوشيال ميديا:* إدارة النمو والتفاعل الرقمي باحترافية.",
    buttons: [[{ text: "📞 طلب إدارة منصات", callback_data: 'contact_human' }], [{ text: "⬅️ العودة", callback_data: 'main_menu' }]]
  },
  tech: {
    text: "💻 *البرمجيات:* تطوير البنية التحتية والمواقع الذكية.",
    buttons: [[{ text: "📞 طلب تنفيذ مشروع", callback_data: 'contact_human' }], [{ text: "⬅️ العودة", callback_data: 'main_menu' }]]
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;
  if (!chatContext[chatId]) chatContext[chatId] = [];

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  // 1. التعامل مع الأوامر المباشرة والخدمات
  if (userText === '/start' || userText === '/services' || (userText && userText.includes('خدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2. معالجة الرسائل النصية العادية عبر الذكاء الاصطناعي (AI)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      if (chatContext[chatId].length > 10) chatContext[chatId].shift();

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: "ROLE: HORUS (حورس الرقمي). Majestic, Wise, Professional Egyptian Executive. Represent EchoWave Media Group LTD only." },
            ...chatContext[chatId]
          ],
          temperature: 0.7
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, `السلام عليكم ${userName}، حورس يمر بتحديث بسيط، نعود للخدمة فوراً.`);
    }
  }
});

// 🧠 معالجة الضغط على الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  try {
    if (action === 'main_menu') {
      await bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
    } else if (action === 'service_branding') {
      await bot.editMessageText(services.branding.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.branding.buttons } });
    } else if (action === 'service_social') {
      await bot.editMessageText(services.social.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.social.buttons } });
    } else if (action === 'service_tech') {
      await bot.editMessageText(services.tech.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.tech.buttons } });
    } else if (action === 'free_audit') {
      await bot.editMessageText("👁️ فضلاً أرسل (الموقع، منصات السوشيال ميديا، ورقم الواتساب) وسأقوم بفحصها فوراً.", { chat_id: chatId, message_id: msg.message_id, reply_markup: { inline_keyboard: [[{ text: "⬅️ العودة", callback_data: 'main_menu' }]] } });
    } else if (action === 'contact_human') {
      const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*: \n\n📱 *المهندس عمرو:* 01144408455 \n\n📍 [تحدث معنا عبر واتساب مباشرة](https://wa.me/201144408455)`;
      bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
    bot.answerCallbackQuery(callbackQuery.id);
  } catch (e) { console.error(e); }
});
