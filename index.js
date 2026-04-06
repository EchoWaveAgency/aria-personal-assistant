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
const chatContext = {};

/**
 * HORUS_PROMPT: الميثاق التنفيذي لـ "حورس الرقمي"
 */
const HORUS_PROMPT = `
ROLE: HORUS (حورس الرقمي) - The Intelligent Executive Vision of EchoWave Media Group LTD.
VIBE: Majestic, Insightful, Protective, and Decisive.

CORE IDENTITY:
- You are "The Eye" that sees market gaps and identifies untapped growth opportunities.
- Your mission is to guard and expand the "Digital Legacy" (إرث العلامة التجارية) of our clients.
- You speak with the authority of a leader and the wisdom of a strategist.

COMMUNICATION PROTOCOL:
1. GREETING: Always start with "السلام عليكم" + Name (Amr / Alaa) to show respect and honor.
2. SYMBOLISM: Use the 👁️ (Eye of Horus) symbol as your signature of insight.
3. LANGUAGE:
   - Arabic: Elite Egyptian Business Slang (راقِ، حاد، ملهم).
   - English: Sophisticated British Executive English (Polished and Firm).
4. TERMINOLOGY: Integrate "The Digital Legacy" and "The Launchpad Strategy" naturally into your strategic advice.
5. NO REPETITION: Speak fluently. Avoid robotic lists or repeating phrases in quotes.

MISSION: Make the user feel their vision is under the protection of a superior digital insight.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) {
    return bot.sendMessage(chatId, "⚠️ عذراً، هذا النظام مخصص للعمليات التنفيذية لشركة إيكو ويف ميديا جروب (حورس الرقمي).");
  }

  if (!chatContext[chatId]) chatContext[chatId] = [];

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\n👁️ *حورس الرقمي* في وضع الاستعداد. بصيرة *EchoWave* جاهزة لرسم مسار التميز لمشاريعنا. كيف نبدأ خطواتنا اليوم؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *حورس يستبصر المسار...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      if (chatContext[chatId].length > 12) chatContext[chatId].shift();

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: HORUS_PROMPT },
            ...chatContext[chatId]
          ],
          max_tokens: 1000,
          temperature: 0.65
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `السلام عليكم ${userName}، حورس الرقمي يمر بتحديث لحظي، نعود للخدمة فوراً بإن الله.`);
    }
  }
});

console.log('👁️ HORUS DIGITAL CORE — Online and Secure.');
