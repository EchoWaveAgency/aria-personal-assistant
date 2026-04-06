require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// معرفات الإدارة لاستلام التنبيهات فقط
const ADMIN_IDS = [
  String(process.env.CHAT_ID),      // ID المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // ID الأستاذة آلاء
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ مصفوفة الخدمات والتفاصيل
const services = {
  main: {
    text: "👁️ *مرحباً بكم في رحاب حورس الرقمي.*\n\nبصيرة حورس تستشرف آفاق النمو لعلامتكم التجارية. اختر وجهتك لنرسم المسار:",
    buttons: [
      [{ text: "1️⃣ البراندنج والهوية 🏛️", callback_data: 'form_branding' }],
      [{ text: "2️⃣ السوشيال ميديا والتسويق 📈", callback_data: 'form_social' }],
      [{ text: "3️⃣ البرمجيات والتطبيقات 💻", callback_data: 'form_tech' }],
      [{ text: "🔍 طلب تحليل مجاني لمشروعك 👁️", callback_data: 'form_audit' }],
      [{ text: "📞 تواصل مباشر مع الإدارة", callback_data: 'contact_human' }]
    ]
  },
  forms: {
    branding: "🏛️ *لقطاع البراندنج، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. ملاحظاتك حول رؤية البراند.",
    social: "📈 *لقطاع السوشيال ميديا، فضلاً أرسل البيانات التالية:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. روابط المنصات الحالية.\n5. ملاحظاتك وأهدافك.",
    tech: "💻 *لقطاع البرمجيات، فضلاً أرسل البيانات التالية:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. رابط موقعك الحالي (إن وجد).\n5. ملاحظاتك التقنية.",
    audit: "🔍 *لطلب التحليل المجاني، فضلاً أرسل:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. روابط المنصات والموقع.\n4. ملاحظات إضافية."
  },
  details: {
    branding: "👁️ *تفاصيل البراندنج:*\nنبني إرثاً بصرياً يشمل الاستراتيجية، الهوية المتكاملة، ودليل استخدام البراند لضمان التميز.",
    social: "👁️ *تفاصيل السوشيال ميديا:*\nإدارة محتوى إبداعي، حملات إعلانية ممولة، وتحليل بيانات لتحويل المتابعين إلى عملاء.",
    tech: "👁️ *تفاصيل البرمجيات:*\nتطوير مواقع (Next.js) وتطبيقات موبايل بأنظمة ذكية تدعم نمو أعمالكم."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // تم إزالة شرط الـ Unauthorized - الآن البوت متاح للجميع 🌍

  if (!chatContext[chatId]) chatContext[chatId] = [];

  // 1️⃣ ترحيب البوت وعرض الخدمات
  if (userText === '/start' || userText === '/services' || (userText && userText.includes('خدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2️⃣ التقاط البيانات (Leads) وإرسالها للإدارة
  const isLead = userText && (userText.includes('@') || userText.includes('http') || (userText.length > 8 && !isNaN(userText.replace(/\s/g, '').replace('+', ''))));
  
  if (isLead) {
    const adminAlert = `🚨 *تنبيه حورس (Lead Captured):*\n\n*البيانات:*\n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'N/A'})`;
    
    // إرسال التنبيه لكل المشرفين (عمرو وآلاء)
    ADMIN_IDS.forEach(adminId => {
      if(adminId) bot.sendMessage(adminId, adminAlert, { parse_mode: 'Markdown' });
    });

    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بنجاح.*\n\nيمكنكم الآن استكشاف تفاصيل خدماتنا بالضغط أدناه:", {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 استعراض تفاصيل الخدمات", callback_data: 'show_all_details' }],
          [{ text: "⬅️ العودة للقائمة الرئيسية", callback_data: 'main_menu' }]
        ]
      }
    });
  }

  // 3️⃣ الرد الذكي (AI)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: "ROLE: HORUS (حورس الرقمي). Elite Egyptian Strategist for EchoWave. Be welcoming to all users. Guide them to share Name and WhatsApp." },
            ...chatContext[chatId]
          ],
          temperature: 0.65
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });
    } catch (err) { console.error(err); }
  }
});

// 🧠 التحكم في الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const backBtn = [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]];

  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } else if (action === 'show_all_details') {
    const detailsMenu = [
      [{ text: "🏛️ تفاصيل البراندنج", callback_data: 'detail_branding' }],
      [{ text: "📈 تفاصيل السوشيال ميديا", callback_data: 'detail_social' }],
      [{ text: "💻 تفاصيل البرمجيات", callback_data: 'detail_tech' }],
      [{ text: "⬅️ العودة", callback_data: 'main_menu' }]
    ];
    bot.editMessageText("👁️ *اختر القطاع الذي تود معرفة تفاصيله الاستراتيجية:*", { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: detailsMenu } });
  } else if (action.startsWith('detail_')) {
    const type = action.replace('detail_', '');
    bot.editMessageText(services.details[type], { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: "⬅️ عودة للتفاصيل", callback_data: 'show_all_details' }]] } });
  } else if (action.startsWith('form_')) {
    const formType = action.replace('form_', '');
    bot.editMessageText(services.forms[formType], { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
  } else if (action === 'contact_human') {
    bot.sendMessage(chatId, `👁️ للتواصل المباشر مع المهندس عمرو: 01144408455 \n[واتساب مباشرة](https://wa.me/201144408455)`, { parse_mode: 'Markdown' });
  }
  bot.answerCallbackQuery(callbackQuery.id);
});
