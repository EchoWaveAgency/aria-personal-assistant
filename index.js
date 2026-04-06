require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: { autoStart: true, params: { timeout: 10 } }
});

// قائمة الصلاحيات (تأكد من صحة الأرقام في ملف الـ .env)
const AUTHORIZED_USERS = [
  String(process.env.CHAT_ID),      // معرف المهندس عمرو
  String(process.env.ALAA_CHAT_ID)  // معرف أستاذة آلاء (1036943414)
];

const GROQ_KEY = process.env.GROQ_API_KEY;
const chatContext = {};

const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Sophisticated, Natural, Professional, and Inspiring.

CORE RULES:
1. GREETING: Start with "السلام عليكم" + Name ONLY in the first message.
2. IDENTITY: For Project "Clothing Factory", you represent Nano Marketing Solutions.
3. STYLE: Elegant Egyptian Business Slang. High-end British Executive English.
4. MEMORY: Use previous context to stay on track. Never ask "Who are you?" if already chatting.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  // 🛡️ طبقة الحماية (Security Layer)
  if (!AUTHORIZED_USERS.includes(chatId)) {
    console.log(`⚠️ Blocked Access from ID: ${chatId}`);
    return bot.sendMessage(chatId, "⚠️ عذراً، هذا النظام مخصص لإدارة العمليات التنفيذية لشركة إيكو ويف ونانو ماركتنج فقط.");
  }

  if (!chatContext[chatId]) chatContext[chatId] = [];

  // تحديد الاسم للترحيب الراقي
  let userName = (chatId === String(process.env.CHAT_ID)) ? "يا مهندس عمرو" : "يا أستاذة آلاء";

  if (userText === '/start') {
    chatContext[chatId] = []; 
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\nنظام *EchoWave* في خدمتك. كيف يمكننا اليوم تحويل الرؤى إلى واقع ملموس؟`, { parse_mode: 'Markdown' });
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
      bot.sendMessage(chatId, `السلام عليكم ${userName}، نعتذر عن هذا التأخير البسيط، السيستم قيد التحديث لخدمتكم.`);
    }
  }
});

console.log('🏛️ ARIA is Online and Accessible for Authorized Personnel.');
