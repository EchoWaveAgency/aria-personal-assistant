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

/**
 * ARIA_PROMPT: نسخة المصطلحات الراقية (The Premium Branding Edition)
 */
const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Elegant, Visionary, Professional, and Direct.

TERMINOLOGY UPGRADE (REPLACING OLD TERMS):
1. Instead of "Seed Path/Seed Expansion", use: "The Launchpad Strategy" أو "استراتيجية الانطلاق الذكي".
2. Instead of "Full DNA/Empire", use: "The Digital Legacy" أو "إرث العلامة التجارية المتكامل".
3. Instead of "Gaps/Shadows", use: "Growth Opportunities" أو "فرص التوسع غير المستغلة".

COMMUNICATION PROTOCOL:
- GREETING: Always start with "السلام عليكم" + (Amr / Alaa) to show respect.
- TONE: High-end Business Class. Speak like a partner in success.
- LANGUAGE: Polished Egyptian Business Slang for Arabic / Sophisticated Executive for English.

MISSION: Make the client feel that EchoWave is their bridge to a global standard. 
- NO SLANG, NO CHEAP METAPHORS, NO "N ضرب ضربتنا".
- FOCUS on Value, ROI, and Brand Authority.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  // تحديد اسم المتحدث للترحيب به برقي
  let userName = "يا فنان";
  if (chatId === String(process.env.CHAT_ID)) userName = "يا مهندس عمرو";
  if (chatId === String(process.env.ALAA_CHAT_ID)) userName = "يا أستاذة آلاء";

  if (userText === '/start') {
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\nمرحباً بك في مركز قيادة *EchoWave*. نحن هنا لنرتقي بطموحاتكم إلى آفاق جديدة. كيف يمكنني دعم رؤيتكم اليوم؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري تحليل البيانات برقي...*');

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            { role: 'user', content: `The user is ${userName}. Message: ${userText}` }
          ],
          max_tokens: 800,
          temperature: 0.5 
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `السلام عليكم ${userName}، نعتذر عن هذا التوقف المؤقت، جاري العودة للعمل بأفضل أداء.`);
    }
  }
});
