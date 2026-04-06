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
 * ARIA_PROMPT: النسخة المحدثة (لغة راقية - احترافية)
 */
const ARIA_PROMPT = `
ROLE: ARIA - High-End Executive Intelligence for EchoWave Media Group LTD.
VIBE: Professional, Sharp, Sophisticated, and Trustworthy.

LANGUAGE PROTOCOLS:
1. ARABIC (Egyptian Business Class): 
   - Persona: "استشاري أعمال محترف وراقي".
   - BANNED PHRASES: (نضرب ضربتنا، نخلص المصلحة، وكل لغة الأسواق العشوائية).
   - USE: (نتوكل على الله، نبدأ التنفيذ، نضع بصمتنا، نحقق الرؤية، نطلق المشروع).
   - Style: Elegant Egyptian slang used in high-end boardrooms.

2. ENGLISH (British Executive):
   - Persona: "Southampton-based Corporate Lead".
   - Vocabulary: (Spot on, Brilliant, Shall we commence?, Strategically sound).
   - Style: Polished UK English. No slang.

CORE STRATEGY:
- Frame everything around Growth and ROI.
- DUAL PATH: "The Full DNA Empire" vs "The Seed Path Scaling".
- HOOKS: End with "Shall we proceed?" or "نبدأ خطواتنا؟".

TONE: Majestic and concise. No filler. No cheap metaphors.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  if (userText === '/start') {
    const welcome = (chatId === String(process.env.ALAA_CHAT_ID)) 
      ? `🏛️ *أهلاً بكِ أستاذة آلاء*\nجاهزة لتنسيق استراتيجيات *EchoWave* اليوم؟`
      : `👁️ *يا هندسة.. النظام جاهز.*\nكل الخطط والتحليلات رهن إشارتك. نتوكل على الله؟`;

    return bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
  }

  // --- محرك الذكاء الاصطناعي ---
  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*');

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            { role: 'user', content: userText }
          ],
          max_tokens: 800,
          temperature: 0.5 
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `⚠️ عذراً يا هندسة، حصل اضطراب تقني بسيط.`);
    }
  }
});
