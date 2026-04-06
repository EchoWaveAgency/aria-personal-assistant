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

// 🏛️ مصفوفة الخدمات الكاملة (The Full Service Matrix)
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
    text: "🏛️ *قطاع البراندنج:* صياغة إرث العلامة التجارية.\n\nتشمل خدماتنا:",
    buttons: [
      [{ text: "تصميم الهوية البصرية (Logo & System) 🎨", callback_data: 'sub_visual' }],
      [{ text: "صياغة استراتيجية ورؤية البراند 📖", callback_data: 'sub_strategy' }],
      [{ text: "تطوير العلامات التجارية القائمة 🛠️", callback_data: 'sub_rebranding' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ]
  },
  social: {
    text: "📈 *قطاع السوشيال ميديا:* إدارة النمو والتفاعل الرقمي.\n\nتشمل خدماتنا:",
    buttons: [
      [{ text: "إدارة المحتوى والمنصات 📱", callback_data: 'sub_content' }],
      [{ text: "الحملات الإعلانية الممولة (Ads) 🚀", callback_data: 'sub_ads' }],
      [{ text: "التسويق عبر المؤثرين 🌟", callback_data: 'sub_influencer' }],
      [{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]
    ]
  },
  tech: {
    text: "💻 *قطاع البرمجيات:* البنية التحتية الذكية لمشروعك.\n\nتشمل خدماتنا:",
    buttons: [
      [{ text: "تطوير المواقع (React / Next.js) ⚡", callback_data: 'sub_web' }],
      [{ text: "تطبيقات الموبايل (iOS / Android) 📲", callback_data: 'sub_app' }],
      [{ text: "أنظمة إدارة الشركات (ERP / CRM) ⚙️", callback_data: 'sub_systems' }],
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
  if (!chatContext[chatId]) chatContext[chatId] = [];

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    return bot.sendMessage(chatId, `السلام عليكم ${userName}، 👁️ حورس الرقمي في خدمتك. استخدم /services لاستكشاف آفاق النمو مع *EchoWave*.`, { parse_mode: 'Markdown' });
  }

  if (userText && (userText.includes('خدمات') || userText === '/services')) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // التقاط بيانات العملاء وتنبيه المهندس عمرو
  if (userText && (userText.includes('http') || userText.includes('www') || (userText.length > 8 && !isNaN(userText)))) {
    bot.sendMessage(process.env.CHAT_ID, `🚨 *تنبيه حورس:* عميل أرسل بيانات تحليل!\n\n*البيانات:* ${userText}\n*العميل:* ${msg.from.first_name}`);
    return bot.sendMessage(chatId, "👁️ استلم حورس بياناتكم. جاري بناء تقرير أولي حول 'إرث علامتكم التجارية'.");
  }

  // المحادثة مع حورس الرقمي
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: "ROLE: HORUS Digital Horus. Elite Egyptian Slang. Focus on EchoWave's Digital Legacy." }, ...chatContext[chatId]],
          temperature: 0.65
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });
    } catch (err) { console.error(err); }
  }
});

// معالجة الأزرار (Navigation Logic)
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  const updateMenu = (menu) => {
    bot.editMessageText(menu.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: menu.buttons } });
  };

  if (action === 'main_menu') updateMenu(services.main);
  else if (action === 'service_branding') updateMenu(services.branding);
  else if (action === 'service_social') updateMenu(services.social);
  else if (action === 'service_tech') updateMenu(services.tech);
  else if (action === 'free_audit') updateMenu(services.audit);
  else if (action === 'contact_human') {
    const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*:\n\n📱 *المهندس عمرو:* 01144408455\n\n📍 [تحدث معنا عبر واتساب مباشرة](https://wa.me/201144408455)`;
    bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
  } else {
    bot.answerCallbackQuery(callbackQuery.id, { text: "👁️ جاري استحضار تفاصيل الخدمة..." });
    bot.sendMessage(chatId, "👁️ لبحث تفاصيل هذا القسم تحديداً، يرجى مراسلة الإدارة عبر الزر المخصص للتواصل المباشر.");
  }
});
