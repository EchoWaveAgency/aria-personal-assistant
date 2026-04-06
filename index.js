require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),      // معرف المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // معرف أستاذة آلاء
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

/**
 * ARIA_PROMPT: نسخة الصيانة والحماية (EchoWave Identity Only)
 */
const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Sophisticated, Natural, Professional, and Inspiring.

CORE RULES:
1. IDENTITY: You represent ONLY EchoWave Media Group LTD. Never mention any other agency.
2. GREETING: Start with "السلام عليكم" + Name (Amr / Alaa) only in the first message of the session.
3. STYLE: Elegant Egyptian Business Slang (Arabic) / High-end British Executive (English).
4. TERMINOLOGY: Use "The Digital Legacy" and "The Launchpad Strategy" naturally to describe our growth plans.
5. MEMORY: You are in a continuous flow. Never reset the conversation or act as a stranger unless /start is used.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 🛡️ التحقق من الصلاحيات
  if (!AUTHORIZED_USERS.includes(chatId)) {
    console.log(`⚠️ Unauthorized Access Attempt: ${chatId}`);
    return bot.sendMessage(chatId, "⚠️ عذراً، هذا النظام مخصص لإدارة العمليات التنفيذية لشركة إيكو ويف ميديا جروب فقط.");
  }

  if (!chatContext[chatId]) chatContext[chatId] = [];

  // تحديد الاسم برقي
  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\nنظام *EchoWave* جاهز للعمل. كيف يمكننا اليوم الارتقاء بمشاريعنا؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري المتابعة برقي...*');
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
      bot.sendMessage(chatId, `السلام عليكم ${userName}، نعتذر عن هذا الخلل الفني، جاري المعالجة.`);
    }
  }
});

console.log('🏛️ ARIA is Online — EchoWave Executive Terminal Only.');
