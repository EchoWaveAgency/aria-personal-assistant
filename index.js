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

// مخزن مؤقت للذاكرة (بيحفظ آخر 10 رسائل لكل مستخدم)
const chatContext = {};

const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Sophisticated, Natural, Professional, and Inspiring.

CORE RULES:
1. MEMORY: You are part of an ongoing conversation. Use previous context to provide continuous solutions.
2. NO REPETITION: Do not repeat greetings or formal introductions if the conversation is already flowing.
3. GREETING: Only say "السلام عليكم" + Name in the very first message of the session. After that, be direct and focus on the task.
4. STYLE: Elegant Egyptian Business Slang (Arabic) / High-end British Executive (English).
5. TERMINOLOGY: Naturally use "The Digital Legacy" and "The Launchpad Strategy" without quotes or robotic repetition.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  // تهيئة الذاكرة للمستخدم لو مش موجودة
  if (!chatContext[chatId]) {
    chatContext[chatId] = [];
  }

  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    chatContext[chatId] = []; // تصفير الذاكرة عند البدء من جديد
    return bot.sendMessage(chatId, `السلام عليكم ${userName}، مركز قيادة *EchoWave* في خدمتك. نبدأ العمل؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري المتابعة برقي...*');

      // إضافة رسالة المستخدم للذاكرة
      chatContext[chatId].push({ role: 'user', content: userText });

      // الحفاظ على آخر 10 رسائل فقط عشان السرعة
      if (chatContext[chatId].length > 10) chatContext[chatId].shift();

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            ...chatContext[chatId] // نبعت التاريخ الكامل للمحادثة
          ],
          max_tokens: 1000,
          temperature: 0.6
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      const aiReply = response.data.choices[0].message.content;

      // إضافة رد الذكاء الاصطناعي للذاكرة
      chatContext[chatId].push({ role: 'assistant', content: aiReply });

      bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `عذراً ${userName}، حصل تداخل بسيط في البيانات.`);
    }
  }
});
