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

// 🏛️ مصفوفة الخدمات الكاملة
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
    text: "🏛️ *قطاع البراندنج:* صياغة إرث العلامة التجارية.\n\nتشمل خدماتنا تصميم الهوية البصرية الشاملة، صياغة الاستراتيجيات، وتطوير البراندات القائمة.",
    buttons: [
      [{ text: "📞 طلب استشارة في البراندنج", callback_data: 'contact_human' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ]
  },
  social: {
    text: "📈 *قطاع السوشيال ميديا:* إدارة النمو والتفاعل الرقمي.\n\nنشمل إدارة المحتوى، الحملات الإعلانية الممولة، والتسويق عبر المؤثرين باحترافية.",
    buttons: [
      [{ text: "📞 طلب حملة إعلانية أو إدارة", callback_data: 'contact_human' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ]
  },
  tech: {
    text: "💻 *قطاع البرمجيات:* البنية التحتية الذكية.\n\nنطور المواقع بـ React/Next.js وتطبيقات الموبايل وأنظمة الـ ERP الخاصة بالشركات.",
    buttons: [
      [{ text: "📞 طلب تنفيذ مشروع برمجيات", callback_data: 'contact_human' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ]
  },
  audit: {
    text: "👁️ *خدمة التحليل المجاني:*\n\nفضلاً أرسل رسالة تشمل (رابط الموقع، روابط المنصات، ورقم الواتساب) ليبدأ حورس في استبصار المسار.",
    buttons: [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]]
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;
  
  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start' || userText === '/services' || (userText && userText.includes('خدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // التقاط البيانات وتنبيه الإدارة
  if (userText && (userText.includes('http') || userText.includes('www') || (userText.length > 8 && !isNaN(userText)))) {
    bot.sendMessage(process.env.CHAT_ID, `🚨 *تنبيه حورس:* عميل أرسل بيانات للتحليل!\n\n*البيانات:* ${userText}\n*العميل:* ${msg.from.first_name}`);
    return bot.sendMessage(chatId, "👁️ استلم حورس بياناتكم بنجاح. جاري بناء تقرير أولي.");
  }
});

// 🧠 معالجة الضغط على الأزرار (تعديل الـ Logic لضمان الاستجابة)
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
      await bot.editMessageText(services.audit.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.audit.buttons } });
    } else if (action === 'contact_human') {
      const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*:\n\n📱 *المهندس عمرو:* 01144408455\n\n📍 [تحدث معنا عبر واتساب مباشرة](https://wa.me/201144408455)`;
      await bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  } catch (e) {
    console.error("Navigation Error:", e);
    bot.answerCallbackQuery(callbackQuery.id, { text: "👁️ حورس يقوم بتحديث البيانات، حاول مرة أخرى." });
  }
});
