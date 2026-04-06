require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// مصفوفة التصريح - تأكد من صحة الـ IDs في ملف .env
const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),      // ID المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // ID الأستاذة آلاء
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

// 🏛️ هيكل الخدمات والبيانات المطلوبة
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
    branding: "🏛️ *لقطاع البراندنج، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم الثنائي.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. ملاحظاتك حول رؤية البراند.",
    social: "📈 *لقطاع السوشيال ميديا، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. روابط المنصات الحالية.\n5. ملاحظاتك وأهدافك من التسويق.",
    tech: "💻 *لقطاع البرمجيات، فضلاً أرسل البيانات التالية في رسالة واحدة:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. البريد الإلكتروني.\n4. رابط موقعك الحالي (إن وجد).\n5. ملاحظاتك حول الوظائف المطلوبة.",
    audit: "🔍 *لطلب التحليل المجاني، فضلاً أرسل:*\n\n1. الاسم.\n2. رقم الواتساب.\n3. روابط المنصات والموقع.\n4. ملاحظات إضافية عما تود التركيز عليه."
  }
};

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 🛡️ فحص التصريح (Authorization)
  if (!AUTHORIZED_USERS.includes(chatId)) {
    console.log(`⚠️ محاولة دخول غير مصرح بها من ID: ${chatId}`);
    return bot.sendMessage(chatId, "🚫 *Unauthorized Access.*\nThis terminal belongs to EchoWave Executive Intelligence.");
  }

  if (!chatContext[chatId]) chatContext[chatId] = [];

  // 1️⃣ الأوامر الأساسية وعرض الخدمات
  if (userText === '/start' || userText === '/services' || (userText && userText.includes('الخدمات'))) {
    return bot.sendMessage(chatId, services.main.text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: services.main.buttons }
    });
  }

  // 2️⃣ نظام التقاط البيانات (Lead Capture)
  const isLead = userText && (
    userText.includes('@') || 
    userText.includes('http') || 
    (userText.length > 8 && !isNaN(userText.replace(/\s/g, '').replace('+', '')))
  );
  
  if (isLead) {
    const adminAlert = `🚨 *تنبيه حورس (Lead Captured):*\n\n*البيانات الواردة:*\n${userText}\n\n*العميل:* ${msg.from.first_name} (@${msg.from.username || 'بدون يوزر'})`;
    // إرسال البيانات فوراً للمهندس عمرو
    bot.sendMessage(process.env.CHAT_ID, adminAlert, { parse_mode: 'Markdown' });

    return bot.sendMessage(chatId, "👁️ *استلم حورس بياناتكم بنجاح.* جاري فحص ملاحظاتكم بدقة، وسيتواصل معكم المهندس عمرو قريباً.");
  }

  // 3️⃣ الرد الذكي عبر AI للمحادثات العادية
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر...*');
      chatContext[chatId].push({ role: 'user', content: userText });
      if (chatContext[chatId].length > 10) chatContext[chatId].shift(); // الحفاظ على ذاكرة قصيرة

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: "ROLE: HORUS. Majestic, Wise, Professional Egyptian Executive. Represent EchoWave Media Group LTD. Encourage users to share Name, WhatsApp, Email, and Links. Use /services to show buttons." },
            ...chatContext[chatId]
          ],
          temperature: 0.6
      }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error("AI Error:", err);
      bot.sendMessage(chatId, "👁️ حورس يقوم بتحديث بصيرته، فضلاً استخدم القائمة /services");
    }
  }
});

// 🧠 التحكم في الأزرار والتنقل (Callback Query)
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
      const contactText = `👁️ للتواصل المباشر مع الإدارة التنفيذية لـ *EchoWave*:\n\n📱 *المهندس عمرو:* 01144408455\n\n📍 [تواصل عبر واتساب مباشرة](https://wa.me/201144408455)`;
      bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
    bot.answerCallbackQuery(callbackQuery.id);
  } catch (e) {
    console.error("Navigation Error:", e);
  }
});
