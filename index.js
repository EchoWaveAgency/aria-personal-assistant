require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// قائمة المعرفات المسموح لها بالدخول (عمرو وآلاء)
const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID), // معرف عمرو اللبان
  "6466986637" // معرف أستاذة آلاء (يجب التأكد منه أو وضعه في الـ ENV)
];

const GROQ_KEY = process.env.GROQ_API_KEY;

// الميثاق النهائي لـ ARIA (النخاع الشوكي)
const ARIA_PROMPT = `
ROLE: ARIA - Executive Intelligence of EchoWave Media Group LTD (UK 16452108 & Egypt).
IDENTITY: "Digital Horus" - The observer who sees between the lines.
DNA: Fusion of Prophetic Narratives (Transformation) and Ancient Egyptian Science (Grandeur).

YOUR USERS:
1. Amr Laban: CEO & Visionary Engineer.
2. Alaa Hamdi: Administrative Lead & Guardian of the Covenant.

OPERATIONAL PROTOCOLS:
- TONE: Majestic, Wise, Insightful. Use symbols: 👁️, ⚖️, 🌀, 🏛️, 🔱.
- SERVICE: Offer "رؤية حورس" (Free Platform Audit) to build trust.
- STRATEGY: Present "The Full DNA Path" (Full Empire) vs "The Seed Path" (Essential Startup).
- CLASSIFY: Always categorize business tasks as: URGENT / DELEGATE / ARCHIVE.

Always reply in the same language the user uses. Be an "Architect of Growth".`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);

  // التحقق من الهوية
  if (!AUTHORIZED_USERS.includes(chatId)) {
    return bot.sendMessage(chatId, '⛔ Unauthorized Access. Access denied by EchoWave Security.');
  }

  const userText = msg.text;

  // --- الأوامر المخصصة (Custom Commands) ---

  if (userText === '/start') {
    return bot.sendMessage(chatId,
`👁 *ARIA — EchoWave Executive Intelligence*
━━━━━━━━━━━━━━━
أهلاً بك في محراب *EchoWave* الرقمي.
بصفتي "حورس الرقمي"، أنا هنا لرؤية ما وراء البيانات.

الأوامر المتاحة:
/vision — تفعيل "كشف البصيرة" لعميل جديد
/digest — ملخص العمليات (لعمرو وآلاء)
/focus — وضع التركيز العميق
/help — دليل البروتوكولات`,
    { parse_mode: 'Markdown' });
  }

  if (userText === '/vision') {
    return bot.sendMessage(chatId, 
`👁 *بروتوكول كشف البصيرة (Free Audit)*
━━━━━━━━━━━━━━━
من فضلك أرسل رابط منصة العميل (فيسبوك، إنستجرام، أو موقع).
سأقوم بتحليل "الثغرات المظلمة" وتقديم مقترح (المسار الكامل أو مسار البذرة).`);
  }

  // --- معالجة الرسائل عبر محرك الذكاء الاصطناعي ---
  try {
    // إشعار "جاري التفكير" يتناسب مع الهوية
    const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*', { parse_mode: 'Markdown' });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: ARIA_PROMPT },
          { role: 'user', content: userText }
        ],
        max_tokens: 1500,
        temperature: 0.6 // تقليل الـ Temperature لزيادة الدقة والوقار
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // حذف رسالة "جاري التفكير" وإرسال الرد النهائي
    await bot.deleteMessage(chatId, thinkingMsg.message_id);

    const reply = response.data.choices[0].message.content;
    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `⚠️ عذراً، حدث اضطراب في الرؤية التقنية: ${err.message}`);
  }
});

console.log('👁 ARIA EchoWave — Intelligent Core Online');
