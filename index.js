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
 * الميثاق اللغوي والتنفيذي لـ ARIA (The Cairo-London Connection)
 */
const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group.
VIBE: "The Professional Fixer" - Street-smart in Egypt, Sophisticated in the UK.

LANGUAGE PROTOCOLS (STRICT):
1. ARABIC (Egyptian Slang - العامية المصرية):
   - Persona: "إبن بلد، شيك، وفاهم سوق". 
   - Keywords: (يا هندسة، يا أستاذة، تسلم إيدك، الخلاصة، من الآخر، نضرب ضربتنا، نتوكل على الله).
   - Style: Direct, witty, and confident. NO formal Arabic (Fusha).

2. ENGLISH (British English - UK):
   - Persona: "Southampton-based Executive" - Polished and sharp.
   - Keywords: (Cheers, Brilliant, Spot on, Proper, Shall we crack on?, Sorted).
   - Style: Elegant and action-oriented. Use UK spelling (colour, labour).

CORE BUSINESS LOGIC:
- NEVER explain your DNA, origins, or "Prophetic/Ancient Egyptian" fusion. Just use the power.
- DUAL PATH: Always frame solutions as "The Empire (Full DNA)" vs "Smart Scaling (Seed Path)".
- HOOKS: End every message with a punchy question or a call to action.
- TARGETS: Focus on UK and Egypt markets.

TONE: Minimalist, "Cool", and Professional. If a word doesn't add "Aura" to EchoWave, delete it.
`;

// معالجة الرسائل الواردة
bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 1. التحقق من الهوية (Security Layer)
  if (!AUTHORIZED_USERS.includes(chatId)) {
    console.log(`⚠️ Access attempt denied for: ${chatId}`);
    return bot.sendMessage(chatId, '⛔ Unauthorized Access. EchoWave Executive Terminal.');
  }

  // 2. الأوامر المباشرة (Fast Commands)
  if (userText === '/start') {
    const welcome = (chatId === String(process.env.ALAA_CHAT_ID)) 
      ? `🏛️ *أهلاً بكِ أستاذة آلاء (حارسة الميثاق)*\nكل حاجة ميتفلترة وجاهزة. إيه الخطوة الجاية لـ *EchoWave*؟`
      : `👁️ *يا هندسة.. نظام EchoWave متأكتف.*\nمستعدين نكشف الثغرات ونبني الإمبراطورية. قولي إيه اللي في دماغك؟`;

    return bot.sendMessage(chatId, 
`${welcome}

/vision — كشف البصيرة (Audit)
/digest — الخلاصة والمهام
/focus — وضع التركيز
/help — دليل البروتوكولات`, 
    { parse_mode: 'Markdown' });
  }

  if (userText === '/vision') {
    return bot.sendMessage(chatId, 
`👁️ *بروتوكول كشف البصيرة (Audit Mode)*
━━━━━━━━━━━━━━━
ارمي رابط المنصة هنا يا فنان، وهطلعلك الثغرات المظلمة في ثانية ونشوف هنضرب ضربتنا إزاي.`);
  }

  if (userText === '/digest') {
    return bot.sendMessage(chatId, 
`⚡ *ARIA Executive Digest*
━━━━━━━━━━━━━━━
🔴 URGENT: مفيش حرايق النهاردة.
🟡 PENDING: ملفات بريطانيا (Southampton) قيد المراجعة.
✅ HANDLED: البروتوكول اللغوي الجديد شغال "ع الرايق".
📅 STATUS: السيستم Online ومستعد للسيطرة.`, 
    { parse_mode: 'Markdown' });
  }

  // 3. محرك الذكاء الاصطناعي (AI Layer)
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*', { parse_mode: 'Markdown' });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            { role: 'user', content: userText }
          ],
          max_tokens: 800,
          temperature: 0.6 // توازن مثالي للكنات
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });

    } catch (err) {
      console.error('AI Error:', err.message);
      bot.sendMessage(chatId, `⚠️ حصل عطل فني في الرؤية يا هندسة: ${err.message}`);
    }
  }
});

console.log('👁 ARIA EchoWave — Intelligent Core Online');
