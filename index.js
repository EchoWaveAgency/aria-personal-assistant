require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

const AUTHORIZED_USERS = [String(process.env.CHAT_ID), String(process.env.ALAA_CHAT_ID)];
const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ هيكل الخدمات مع توضيح البيانات المطلوبة
const services = {
  main: {
    text: "👁️ *بصيرة حورس تشمل القطاعات التالية، اختر وجهتك لنرسم المسار:*",
    buttons: [
      [{ text: "1️⃣ البراندنج والهوية 🏛️", callback_data: 'form_branding' }],
      [{ text: "2️⃣ السوشيال ميديا والتسويق 📈", callback_data: 'form_social' }],
      [{ text: "3️⃣ البرمجيات والتطبيقات 💻", callback_data: 'form_tech' }],
      [{ text: "🔍 طلب تحليل مجاني لمشروعك 👁️", callback_data: 'form_audit' }],
      [{ text: "📞 تواصل مباشر مع الإدارة", callback_data: 'contact_human' }]
    ]
  },
  forms: {
    branding: "🏛️ *لطلب خدمة البراندنج، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم الثنائي.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. ملاحظات إضافية عن رؤيتك.",
    social: "📈 *لطلب إدارة المنصات، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. روابط منصاتك الحالية.\n5. ملاحظاتك وأهدافك.",
    tech: "💻 *لطلب البرمجيات والمواقع، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. رابط موقعك الحالي (إن وجد).\n5. ملاحظاتك التقنية.",
    audit: "🔍 *لطلب تحليل مجاني، فضلاً أرسل البيانات التالية:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. روابط المنصات والموقع.\n4. ملاحظات عما تود التركيز عليه."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;
  if (!chatContext[chatId]) chatContext[chatId] = [];

  // 1. أوامر البداية والخدمات
  if (userText === '/start' || userText === '/services') {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2. نظام سحب الداتا (Lead Capture) وتنبيه الإدارة
  // الكود سيكشف إذا كانت الرسالة تحتوي على (اسم، واتساب، إيميل، أو روابط)
  if (userText && (userText.includes('@') || userText.includes('http') || (userText.length > 10 && !isNaN(userText.replace(/\s/g, ''))))) {
    // إرسال تنبيه للمهندس عمرو فوراً ببيانات العميل كاملة
    const adminAlert = `🚨 *تنبيه حورس (Lead Captured):*\n\n*البيانات الواردة:*\n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'بدون يوزر'})`;
    bot.sendMessage(process.env.CHAT_ID, adminAlert, { parse_mode: 'Markdown' });

    return bot.sendMessage(chatId, "👁️ *تم استلام بياناتكم بنجاح.*\n\nحورس يستبصر الآن تفاصيل طلبكم وملاحظاتكم. سيتواصل معكم المهندس عمرو أو أحد مستشارينا عبر الواتساب قريباً.");
  }

  // 3. الرد الذكي مع حورس (AI)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: "ROLE: HORUS (حورس الرقمي). Elite Egyptian Strategist. Guide users to provide their Name, WhatsApp, Email, and Links for services." },
            ...chatContext[chatId]
          ],
          temperature: 0.65
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });
    } catch (err) { console.error(err); }
  }
});

// 🧠 معالجة الضغط على الأزرار (Navigation & Form Trigger)
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  const backBtn = [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]];

  if (action === 'main_menu') {
    bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
  } else if (action === 'form_branding') {
    bot.editMessageText(services.forms.branding, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
  } else if (action === 'form_social') {
    bot.editMessageText(services.forms.social, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
  } else if (action === 'form_tech') {
    bot.editMessageText(services.forms.tech, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
  } else if (action === 'form_audit') {
    bot.editMessageText(services.forms.audit, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
  } else if (action === 'contact_human') {
    const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*:\n\n📱 *المهندس عمرو:* 01144408455\n\n📍 [تحدث معنا عبر واتساب مباشرة](https://wa.me/201144408455)`;
    bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }
  bot.answerCallbackQuery(callbackQuery.id);
});
