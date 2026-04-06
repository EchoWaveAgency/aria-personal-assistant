require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

const AUTHORIZED_USERS = [String(process.env.CHAT_ID), String(process.env.ALAA_CHAT_ID)];
const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ مصفوفة الخدمات مع الطلبات التفصيلية
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
    branding: "🏛️ *لقطاع البراندنج، فضلاً أرسل البيانات التالية:*\n\n1. الاسم الثنائي.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. ملاحظاتك حول رؤية البراند.",
    social: "📈 *لقطاع السوشيال ميديا، فضلاً أرسل البيانات التالية:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. روابط المنصات الحالية.\n5. ملاحظاتك وأهدافك من التسويق.",
    tech: "💻 *لقطاع البرمجيات، فضلاً أرسل البيانات التالية:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. رابط موقعك الحالي (إن وجد).\n5. ملاحظاتك حول الوظائف المطلوبة.",
    audit: "🔍 *لطلب التحليل المجاني، فضلاً أرسل:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. روابط المنصات والموقع.\n4. ملاحظات إضافية."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;
  if (!chatContext[chatId]) chatContext[chatId] = [];

  // 1. الأوامر الأساسية
  if (userText === '/start' || userText === '/services' || (userText && userText.includes('الخدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2. الفلتر الذكي لالتقاط البيانات (Leads)
  const isLead = userText && (userText.includes('@') || userText.includes('http') || (userText.length > 8 && !isNaN(userText.replace(/\s/g, ''))));
  
  if (isLead) {
    const adminAlert = `🚨 *تنبيه حورس (Lead Captured):*\n\n*البيانات:*\n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'N/A'})`;
    bot.sendMessage(process.env.CHAT_ID, adminAlert, { parse_mode: 'Markdown' });

    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بنجاح.* جاري فحص ملاحظاتكم بدقة، وسيتواصل معكم المهندس عمرو قريباً.");
  }

  // 3. المحادثة الذكية (AI)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: "ROLE: HORUS. You represent EchoWave. If the user asks about services, explain briefly then tell them to use the /services command or buttons. Always encourage them to share Name, WhatsApp, Email, and Links." },
            ...chatContext[chatId]
          ],
          temperature: 0.65
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });
    } catch (err) { console.error(err); }
  }
});

// 🧠 التحكم في الأزرار والتنقل
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const backBtn = [[{ text: "⬅️ العودة للرئيسية", callback_data: 'main_menu' }]];

  try {
    if (action === 'main_menu') {
      await bot.editMessageText(services.main.text, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: services.main.buttons } });
    } else if (action.startsWith('form_')) {
      const formType = action.replace('form_', '');
      await bot.editMessageText(services.forms[formType], { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: backBtn } });
    } else if (action === 'contact_human') {
      const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*:\n\n📱 *المهندس عمرو:* 01144408455\n\n📍 [تواصل عبر واتساب](https://wa.me/201144408455)`;
      bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown' });
    }
    bot.answerCallbackQuery(callbackQuery.id);
  } catch (e) { console.error(e); }
});
