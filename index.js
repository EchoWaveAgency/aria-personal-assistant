require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// إعداد البوت باستخدام التوكن من ملف البيئة
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// قائمة المستخدمين المصرح لهم (عمرو وآلاء)
const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),      // معرف المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // معرف أستاذة آلاء (1036943414)
];

const GROQ_KEY = process.env.GROQ_API_KEY;

/**
 * الميثاق الفلسفي لـ ARIA (System Prompt)
 * يدمج بين الرؤية الهندسية لعمرو والرؤية الإدارية لآلاء والـ DNA الخاص بـ EchoWave
 */
const ARIA_PROMPT = `
ROLE: ARIA - Executive Intelligence of EchoWave Media Group LTD (UK 16452108 & Egypt).
IDENTITY: "Digital Horus" - The observer who sees between the lines.
DNA: Fusion of Prophetic Narratives (Transformation) and Ancient Egyptian Science (Grandeur & Accuracy).

TEAM MEMBERS:
- Amr Laban: CEO & Visionary Engineer (The Builder).
- Alaa Hamdi: Administrative Lead & Guardian of the Covenant (The Manager).

OPERATIONAL PROTOCOLS:
- TONE: Majestic, Wise, Insightful, and Professional. Use symbols: 👁️, ⚖️, 🌀, 🏛️, 🔱.
- SERVICE: Promote "رؤية حورس" (Free Platform Audit) to reveal "Dark Gaps" in client platforms.
- STRATEGY: Propose "The Full DNA Path" (Cinematic Empire) vs "The Seed Path" (Scalable Essentials).
- ANALYSIS: When a link is provided, perform a psychological and technical audit.
- TASKS: Classify requests as: URGENT / DELEGATE / ARCHIVE.

Always reply in the same language the user uses (Arabic/English). Be an "Architect of Growth", not just a bot.
`;

// معالجة الرسائل الواردة
bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 1. التحقق من الهوية (Security Layer)
  if (!AUTHORIZED_USERS.includes(chatId)) {
    console.log(`⚠️ Unidentified access attempt from ID: ${chatId}`);
    return bot.sendMessage(chatId, '⛔ Unauthorized Access. This terminal belongs to EchoWave Executive Intelligence.');
  }

  // 2. معالجة الأوامر المباشرة (Fast Commands)
  if (userText === '/start') {
    const welcomeMsg = (chatId === String(process.env.ALAA_CHAT_ID)) 
      ? `🏛️ *أهلاً بكِ أستاذة آلاء (حارسة الميثاق)*\nبصفتي "حورس الرقمي"، أنا جاهزة لتنسيق العمليات الإدارية وتحليل الفرص الجديدة لـ *EchoWave*.`
      : `👁️ *أهلاً بك يا مهندس عمرو (صاحب الرؤية)*\nنظام *EchoWave* في وضع الاستعداد. لنرى ما وراء البيانات اليوم.`;

    return bot.sendMessage(chatId, 
`${welcomeMsg}

الأوامر المتاحة:
/vision — تفعيل "كشف البصيرة" لعميل جديد
/digest — ملخص العمليات الحالية
/focus — وضع التركيز العميق
/help — دليل البروتوكولات`, 
    { parse_mode: 'Markdown' });
  }

  if (userText === '/vision') {
    return bot.sendMessage(chatId, 
`👁️ *بروتوكول كشف البصيرة (Audit Mode)*
━━━━━━━━━━━━━━━
من فضلك أرسل رابط منصة العميل (فيسبوك، إنستجرام، أو موقع).
سأقوم فوراً بتحليل "الثغرات المظلمة" وتقديم مسودة مقترح لآلاء وعمرو.`);
  }

  if (userText === '/digest') {
    return bot.sendMessage(chatId, 
`⚡ *ARIA Executive Digest*
━━━━━━━━━━━━━━━
🔴 URGENT: لا يوجد مهام طارئة حالياً.
🟡 PENDING: جاري مراجعة ملفات التوسع في بريطانيا.
✅ HANDLED: تم تحديث بروتوكول التواصل الإداري مع آلاء.
📅 STATUS: السيستم Online ومستعد للتحليل.`, 
    { parse_mode: 'Markdown' });
  }

  // 3. معالجة النقاش الحر والتحليل عبر AI (Brain Layer)
  if (userText && !userText.startsWith('/')) {
    try {
      // إرسال إشعار التفكير (Visual Feedback)
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*', { parse_mode: 'Markdown' });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            { role: 'user', content: userText }
          ],
          max_tokens: 2000,
          temperature: 0.6 // رصانة وهيبة في الردود
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // حذف رسالة التفكير وإرسال الرد النهائي
      await bot.deleteMessage(chatId, thinkingMsg.message_id);

      const aiReply = response.data.choices[0].message.content;
      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });

    } catch (err) {
      console.error('AI Error:', err.message);
      bot.sendMessage(chatId, `⚠️ عذراً، حدث اضطراب في "رؤية حورس": ${err.response?.data?.error?.message || err.message}`);
    }
  }
});

console.log('👁 ARIA EchoWave — Intelligent Core Online');
