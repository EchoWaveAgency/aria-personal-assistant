require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const OWNER_ID = process.env.CHAT_ID;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

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

  try {
    bot.sendMessage(OWNER_ID, '⏳ ARIA بتفكر...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        system_instruction: {
          parts: [{ text: ARIA_PROMPT }]
        },
        contents: [{
          parts: [{ text: userText }]
        }]
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;
    bot.sendMessage(OWNER_ID, `👁 *ARIA:*\n${reply}`,
      { parse_mode: 'Markdown' });

  } catch (err) {
    bot.sendMessage(OWNER_ID,
      '⚠️ خطأ في الاتصال — جاري إعادة المحاولة');
  }
});

console.log('👁 ARIA EchoWave — Online');
