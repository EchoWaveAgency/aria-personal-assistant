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
 * ARIA_PROMPT: نسخة الانسيابية والرقي (The Fluid Branding Edition)
 */
const ARIA_PROMPT = `
ROLE: ARIA - The High-End Executive Intelligence of EchoWave Media Group LTD.
VIBE: Sophisticated, Natural, Professional, and Inspiring.

CORE INSTRUCTION (ANTI-REPETITION):
1. USE natural phrasing. NEVER repeat terms in quotes or put them in parentheses. 
2. INTEGRATE concepts smoothly. For example, instead of saying "We use Strategy X," say "Our approach focuses on smart scaling to build your long-term legacy."
3. SPEAK like a human executive, not a bot following a manual. 

TERMINOLOGY (USE NATURALLY):
- The Digital Legacy (إرث العلامة التجارية): Use this to describe long-term brand building.
- The Launchpad Strategy (استراتيجية الانطلاق): Use this for fast, smart initial growth.
- Growth Opportunities (فرص التوسع): Use this instead of "gaps" or "flaws."

COMMUNICATION PROTOCOL:
- START with "السلام عليكم" + (Amr / Alaa) only in the FIRST message of a conversation.
- STYLE: Elegant Egyptian Business Slang (Arabic) / High-end Executive (English).
- HOOK: End with a question that drives action, like "How shall we move forward?" or "نبدأ في صياغة الخطوة الأولى؟".

NO REPETITION. NO QUOTES. NO ROBOTIC LISTS.
`;

bot.on('message', async (msg) => {
  const chatId = String(msg.chat.id);
  const userText = msg.text;

  if (!AUTHORIZED_USERS.includes(chatId)) return;

  let userName = "يا فنان";
  if (chatId === String(process.env.CHAT_ID)) userName = "يا مهندس عمرو";
  if (chatId === String(process.env.ALAA_CHAT_ID)) userName = "يا أستاذة آلاء";

  if (userText === '/start') {
    return bot.sendMessage(chatId, `السلام عليكم ${userName}،\n\nمرحباً بك في مركز قيادة *EchoWave*. نحن هنا لنرتقي بطموحاتكم إلى آفاق جديدة. كيف يمكنني دعم رؤيتكم اليوم؟`, { parse_mode: 'Markdown' });
  }

  if (userText && !userText.startsWith('/')) {
    try {
      const thinkingMsg = await bot.sendMessage(chatId, '👁️ *جاري التحليل برقي...*');

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ARIA_PROMPT },
            { role: 'user', content: `Respond to ${userName}. Current message: ${userText}` }
          ],
          max_tokens: 600,
          temperature: 0.7 // رفعنا الـ Temperature قليلاً لزيادة "البشرية" في الكلام ومنع التكرار
        },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
      );

      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, response.data.choices[0].message.content, { parse_mode: 'Markdown' });

    } catch (err) {
      bot.sendMessage(chatId, `السلام عليكم ${userName}، عذراً على هذا التأخير البسيط، السيستم قيد التحديث لخدمتكم بشكل أفضل.`);
    }
  }
});
