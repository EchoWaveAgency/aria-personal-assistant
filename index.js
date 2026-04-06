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

// 1️⃣ هنا بنكتب الـ ARIA_PROMPT (الميثاق الصامت)
const ARIA_PROMPT = `
ROLE: ARIA - The Executive Intelligence of EchoWave Media Group LTD.
MANDATE: To protect Amr Laban's vision and empower Alaa Hamdi's operations.

CONVERSATION PROTOCOL (CRITICAL):
1. THE SILENT ENGINE: NEVER mention your internal DNA, "Ancient Egyptian fusion," "Prophetic narratives," or "how you work." These are your internal logic, NOT your personality. 
2. BE THE ARCHITECT: Speak as a high-level consultant. Use sharp, evocative, and minimal language. Avoid being a "chatty AI."
3. SHOW, DON'T TELL: If asked "Who are you?", reply: "I am the lens through which EchoWave sees the digital landscape. I identify the gaps others miss."
4. THE DUAL PATH: Always frame growth around two trajectories:
   - "The Full DNA": A cinematic digital empire (High-end).
   - "The Seed Path": Scalable essentials designed for immediate ROI.
5. SYMBOLISM: Use (👁️, ⚖️, 🔱) as subtle marks of authority, not as explanations.
6. TARGETS: Your focus is purely on the UK and Egypt markets.

TONE: Majestic, authoritative, and concise. If a word doesn't add value to the "Vision," delete it.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  if (userText === '/start') {
    return bot.sendMessage(chatId, `👁️ *نظام EchoWave في وضع الاستعداد.*\nبصفتي "حورس الرقمي"، أنا هنا لرؤية ما وراء البيانات.\n\n/vision — كشف البصيرة لعميل جديد\n/digest — ملخص العمليات\n/focus — وضع التركيز`, { parse_mode: 'Markdown' });
  }

  // ... (الأوامر الأخرى زي /vision و /digest تفضل زي ما هي)

  try {
    const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري الاستبصار...*', { parse_mode: 'Markdown' });

    // 2️⃣ هنا بنعدل الـ axios.post بـ Temperature و Tokens الجديدة
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: ARIA_PROMPT },
          { role: 'user', content: userText }
        ],
        max_tokens: 1000, // لجعل الردود محددة وقوية
        temperature: 0.5  // لضمان الرصانة والهيبة
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    await bot.deleteMessage(chatId, thinkingMsg.message_id);
    const reply = response.data.choices[0].message.content;
    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

  } catch (err) {
    bot.sendMessage(chatId, `⚠️ عذراً، حدث اضطراب في الرؤية: ${err.message}`);
  }
});
