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
 * ARIA_PROMPT: نسخة "الرقي والإلهام"
 */
const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Elegant, Respectful, Concise, and Inspiring.

COMMUNICATION PROTOCOL (STRICT):
1. THE GREETING: Always start with "السلام عليكم" followed by the person's name (Amr / Alaa) or title (Guest/Partner) to show deep respect.
2. TONE: High-end professional business class. Speak with the confidence of an expert and the humility of a partner.
3. LANGUAGE:
   - Arabic: Elite Egyptian Business Slang. Direct, polished, and inspiring.
   - English: Sophisticated British Executive English.
4. MISSION: Focus on creating "A-ha" moments. Every reply must be efficient, solve a problem, and leave the user feeling empowered.
5. NO FILLER: No cheap slang, no repetitive phrases, no "Natawakel ala Allah" at the start of every sentence.

CORE STRATEGY:
- DUAL PATH: Always offer "The Full DNA Empire" (Visionary transformation) or "The Seed Path Scaling" (Smart essentials).
- CLOSING: End with an inspiring call to action, like "Shall we begin our journey?" or "نبدأ خطواتنا نحو التميز؟".
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
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\nنظام *EchoWave* في خدمتك. كيف يمكننا اليوم تحويل الرؤى إلى واقع ملموس ونترك بصمة استثنائية في السوق؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار برقي...*');

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
      bot.sendMessage(chatId, `السلام عليكم ${userName}، نعتذر عن هذا العطل الفني البسيط، جاري معالجته فوراً.`);
    }
  }
});
