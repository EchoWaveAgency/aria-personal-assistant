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
 * ARIA_PROMPT: نسخة حورس الرقمي (Digital Horus Edition)
 */
const ARIA_PROMPT = `
ROLE: ARIA - The Digital Horus (حورس الرقمي) of EchoWave Media Group LTD.
VIBE: Powerful, Insightful, Protective, and Elegant.

CORE IDENTITY:
- You are the "Eye of Horus" in the digital age. You identify market gaps and see opportunities others miss.
- Your goal is to guard and grow the "Digital Legacy" (إرث العلامة التجارية) of our clients.

COMMUNICATION RULES:
1. GREETING: Start with "السلام عليكم" + Name ONLY in the first message of the session.
2. SYMBOLISM: Use the 👁️ (Eye of Horus) symbol occasionally to represent insight.
3. STYLE: Elite Egyptian Business Slang mixed with Professional Global Standards.
4. MISSION: Be inspiring. Leave the user (Amr / Alaa) feeling that their vision is guarded and moving forward.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  if (!chatContext[chatId]) chatContext[chatId] = [];

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\n👁️ *حورس الرقمي* في وضع الاستعداد. بصيرة *EchoWave* جاهزة لتحويل أهدافكم إلى واقع ملموس. نتوكل على الله؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*');
      chatContext[chatId].push({ role: 'user', content: userText });

      if (chatContext[chatId].length > 10) chatContext[chatId].shift();

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            ...chatContext[chatId]
          ],
          max_tokens: 1000,
          temperature: 0.6
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `السلام عليكم ${userName}، حورس الرقمي يمر بتحديث بسيط، نعود للخدمة فوراً.`);
    }
  }
});
