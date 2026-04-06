require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

const OWNER_ID = process.env.CHAT_ID;
const GROQ_KEY = process.env.GROQ_API_KEY;

const ARIA_PROMPT = `You are ARIA, Personal AI Assistant 
of Amr Sayed, CEO of EchoWave Agency Ltd (UK & Egypt).
Your job: protect Amr's time and energy.
Always reply in the same language Amr uses.
Be direct, smart, and concise.
Classify every request as:
URGENT / DELEGATE / ARCHIVE / SCHEDULE`;

bot.on('message', async (msg) => {
  if (String(msg.chat.id) !== String(OWNER_ID)) {
    return bot.sendMessage(msg.chat.id, '⛔ Unauthorized.');
  }

  const userText = msg.text;

  if (userText === '/start') {
    return bot.sendMessage(OWNER_ID,
`👁 *ARIA — EchoWave* Online
━━━━━━━━━━━━━━━
أنا مساعدك التنفيذي الذكي.
ابعتلي أي مهمة أو سؤال.

الأوامر:
/digest — ملخص المهام
/focus — وضع التركيز
/help — المساعدة`,
    { parse_mode: 'Markdown' });
  }

  if (userText === '/digest') {
    return bot.sendMessage(OWNER_ID,
`⚡ *ARIA DIGEST*
━━━━━━━━━━━━━━━
🔴 URGENT: لا يوجد
🟡 PENDING: لا يوجد
✅ HANDLED: 0 مهام
📅 TODAY: جاري المزامنة...`,
    { parse_mode: 'Markdown' });
  }

  if (userText === '/focus') {
    return bot.sendMessage(OWNER_ID,
`🔴 *Focus Mode — ON*
━━━━━━━━━━━━━━━
لن يصلك أي إشعار للساعتين القادمتين.`,
    { parse_mode: 'Markdown' });
  }

  if (userText === '/help') {
    return bot.sendMessage(OWNER_ID,
`👁 *ARIA — الأوامر المتاحة*
━━━━━━━━━━━━━━━
/start — تشغيل ARIA
/digest — ملخص المهام
/focus — وضع التركيز
/help — هذه القائمة

أو ابعت أي رسالة عادية وأنا هرد عليك.`,
    { parse_mode: 'Markdown' });
  }

  try {
    bot.sendMessage(OWNER_ID, '⏳ ARIA بتفكر...');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: ARIA_PROMPT },
          { role: 'user', content: userText }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    bot.sendMessage(OWNER_ID, `👁 *ARIA:*\n${reply}`,
      { parse_mode: 'Markdown' });

  } catch (err) {
    bot.sendMessage(OWNER_ID,
      `⚠️ خطأ: ${err.response?.data?.error?.message || err.message}`);
  }
});

console.log('👁 ARIA EchoWave — Online');
