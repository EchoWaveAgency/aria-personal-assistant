// ============================================================
//  EchoWave Agency Bot (Horus) — المرحلة الأولى الكاملة
//  المميزات: ترحيب | إشعار أدمن | تسجيل عميل | تأكيد دفع
// ============================================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs          = require('fs');
const path        = require('path');

const BOT_TOKEN = process.env.TELEGRAM_TOKEN;

const ADMINS = [
  { id: Number(process.env.CHAT_ID),      name: 'عمرو' },
  { id: Number(process.env.ALAA_CHAT_ID), name: 'آلاء' },
];

function notifyAdmins(text, options = {}) {
  ADMINS.forEach(admin => bot.sendMessage(admin.id, text, options));
}

const DB_FILE = path.join(__dirname, 'clients.json');
const bot     = new TelegramBot(BOT_TOKEN, { polling: true });

function loadDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ clients: [] }));
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function saveClient(client) {
  const db = loadDB();
  const i  = db.clients.findIndex(c => c.telegramId === client.telegramId);
  if (i >= 0) db.clients[i] = { ...db.clients[i], ...client };
  else db.clients.push({ ...client, joinedAt: new Date().toISOString() });
  saveDB(db);
}
function getClient(telegramId) { return loadDB().clients.find(c => c.telegramId === telegramId); }

const sessions = {};

const mainButtons = [
  [{ text: '🏛️ خدماتنا الاستراتيجية',     callback_data: 'show_all_details' }],
  [{ text: '🔗 بوابة الروابط (Linktree)', url: 'https://linktr.ee/echowaveagency' }],
  [{ text: '💳 الدفع والتحصيل',           callback_data: 'payment_menu' }],
  [{ text: '👁️ طلب تحليل لمشروعك',        callback_data: 'form_audit' }],
  [{ text: '📝 تسجيل بياناتك',            callback_data: 'register_client' }],
  [{ text: '📞 تواصل مع الإدارة',          callback_data: 'contact_human' }],
];

const interestMap = {
  interest_social:   'السوشيال ميديا',
  interest_branding: 'الهوية البصرية',
  interest_ads:      'الإعلانات المدفوعة',
  interest_web:      'المواقع والتطبيقات',
  interest_consult:  'استشارة شاملة',
};

// /start
bot.onText(/\/start/, (msg) => {
  const { id: chatId, first_name, last_name, username: uname } = msg.from;
  const display  = first_name || 'عزيزي';
  const username = uname ? '@' + uname : 'لا يوجد';

  bot.sendMessage(chatId,
    `👁️ *أهلاً وسهلاً ${display}!*\n\nمرحباً بك في *EchoWave Agency* — وكالتك الاستراتيجية المتكاملة.\n\nاختر من القائمة 👇`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: mainButtons } }
  );

  notifyAdmins(
    `🔔 *عميل جديد دخل البوت!*\n\n👤 ${first_name || ''} ${last_name || ''}\n🔗 ${username}\n🆔 \`${chatId}\`\n🕐 ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💬 رد عليه', url: `tg://user?id=${chatId}` }]] } }
  );
});

// /myid
bot.onText(/\/myid/, (msg) => {
  bot.sendMessage(msg.chat.id, `🆔 الـ Telegram ID بتاعك: \`${msg.from.id}\``, { parse_mode: 'Markdown' });
});

// Callback Query
bot.on('callback_query', (query) => {
  const chatId    = query.message.chat.id;
  const messageId = query.message.message_id;
  const action    = query.data;
  const userId    = query.from.id;
  const session   = sessions[chatId];

  bot.answerCallbackQuery(query.id);

  if (action === 'main_menu') {
    bot.editMessageText(
      `👁️ *القائمة الرئيسية — EchoWave Agency*\n\nاختر الخدمة التي تريدها:`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: mainButtons } }
    );

  } else if (action === 'show_all_details') {
    bot.editMessageText(
      `🏛️ *خدماتنا الاستراتيجية:*\n\n🎯 *إدارة السوشيال ميديا* — حضور رقمي قوي ومتسق\n🎨 *الهوية البصرية* — تصميم يعكس قيمة علامتك\n📈 *الإعلانات المدفوعة* — حملات بأقصى عائد\n🌐 *المواقع والتطبيقات* — تطوير تقني احترافي\n📊 *الاستراتيجية والتحليل* — خطط مبنية على بيانات\n\n📩 للاستفسار تواصل معنا:`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '👁️ طلب تحليل مجاني', callback_data: 'form_audit' }],
          [{ text: '📞 تواصل مع الإدارة', callback_data: 'contact_human' }],
          [{ text: '⬅️ عودة للقائمة',    callback_data: 'main_menu' }],
        ]}
      }
    );

  } else if (action === 'payment_menu') {
    bot.editMessageText(
      `💳 *قنوات الاستثمار الآمن لـ EchoWave:*\n\nاختر وسيلة الدفع:\n\n📱 *محفظة إلكترونية:* \`01144408455\`\n\n📌 _بعد الدفع اضغط "تأكيد الدفع" وابعت صورة الإيصال_`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '💳 InstaPay (عمرو)',  url: 'https://ipn.eg/S/amrellaban_83/instapay/7ZsBhb' }],
          [{ text: '💳 InstaPay (آلاء)', url: 'https://ipn.eg/S/alaahassanin2025/instapay/0xMnFV' }],
          [{ text: '📱 محفظة إلكترونية', callback_data: 'wallet_info' }],
          [{ text: '✅ تأكيد الدفع',      callback_data: 'confirm_payment' }],
          [{ text: '⬅️ عودة للقائمة',    callback_data: 'main_menu' }],
        ]}
      }
    );

  } else if (action === 'wallet_info') {
    bot.editMessageText(
      `📱 *المحفظة الإلكترونية — EchoWave:*\n\nالرقم: \`01144408455\`\n\n_افتح تطبيق المحفظة (Vodafone Cash / Orange Cash / Etisalat Cash / WE Pay) وحوّل للرقم_\n\n📌 بعد التحويل اضغط "تأكيد الدفع" وابعت صورة الإيصال`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '✅ تأكيد الدفع', callback_data: 'confirm_payment' }],
          [{ text: '⬅️ عودة للدفع',  callback_data: 'payment_menu' }],
        ]}
      }
    );

  } else if (action === 'confirm_payment') {
    sessions[chatId] = { step: 'awaiting_payment_screenshot' };
    bot.sendMessage(chatId,
      `✅ *ممتاز!*\n\nمن فضلك ابعت *صورة إيصال الدفع* الآن.`,
      { parse_mode: 'Markdown' }
    );

  } else if (action === 'register_client') {
    const existing = getClient(userId);
    if (existing && existing.phone) {
      bot.sendMessage(chatId,
        `✅ *أنت مسجل بالفعل!*\n\n👤 ${existing.name}\n📱 ${existing.phone}\n🎯 ${existing.interest}`,
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
      );
      return;
    }
    sessions[chatId] = { step: 'ask_name', data: { telegramId: userId, username: query.from.username || '' } };
    bot.sendMessage(chatId, `📝 *تسجيل بياناتك*\n\n*ما هو اسمك الكريم؟*`, { parse_mode: 'Markdown' });

  } else if (action === 'form_audit') {
    bot.editMessageText(
      `👁️ *طلب تحليل مجاني لمشروعك*\n\nفريقنا سيحلّل حضورك الرقمي ويقدم توصيات استراتيجية.\n\n📩 للطلب تواصل معنا:`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '💬 تواصل مع الفريق', callback_data: 'contact_human' }],
          [{ text: '⬅️ عودة للقائمة',   callback_data: 'main_menu' }],
        ]}
      }
    );

  } else if (action === 'contact_human') {
    bot.editMessageText(
      `📞 *التواصل مع إدارة EchoWave*\n\nتم إرسال طلبك، سيتواصل معك أحد أعضاء الفريق قريباً.\n\n⏰ أوقات العمل: 9 صباحاً — 11 مساءً`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ عودة للقائمة', callback_data: 'main_menu' }]] } }
    );
    notifyAdmins(
      `📞 *طلب تواصل جديد!*\n\n👤 ${query.from.first_name || ''} ${query.from.last_name || ''}\n🆔 \`${userId}\``,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💬 رد عليه', url: `tg://user?id=${userId}` }]] } }
    );

  } else if (interestMap[action] && session && session.step === 'ask_interest') {
    session.data.interest = interestMap[action];
    saveClient(session.data);
    delete sessions[chatId];
    bot.sendMessage(chatId,
      `🎉 *تم تسجيل بياناتك بنجاح!*\n\n👤 ${session.data.name}\n📱 ${session.data.phone}\n🎯 ${session.data.interest}\n\nسيتواصل معك فريقنا قريباً! 🚀`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
    );
    notifyAdmins(
      `📋 *عميل جديد سجّل بياناته!*\n\n👤 ${session.data.name}\n📱 ${session.data.phone}\n🎯 ${session.data.interest}\n🆔 \`${session.data.telegramId}\``,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💬 تواصل معه', url: `tg://user?id=${session.data.telegramId}` }]] } }
    );

  } else if (action.startsWith('approve_pay_')) {
    bot.answerCallbackQuery(query.id, { text: '✅ تم إرسال التأكيد للعميل' });
    const clientId = parseInt(action.replace('approve_pay_', ''));
    bot.sendMessage(clientId, `✅ *تم تأكيد دفعتك!*\n\nسيتواصل معك فريقنا خلال 24 ساعة. 🚀`, { parse_mode: 'Markdown' });
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });

  } else if (action.startsWith('reject_pay_')) {
    bot.answerCallbackQuery(query.id, { text: '❌ تم إرسال الرفض للعميل' });
    const clientId = parseInt(action.replace('reject_pay_', ''));
    bot.sendMessage(clientId,
      `❌ *لم يتم التحقق من الإيصال*\n\nتأكد من وضوح الصورة ثم أعد الإرسال أو تواصل مع الإدارة.`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '🔄 إعادة إرسال الإيصال', callback_data: 'confirm_payment' }],
          [{ text: '📞 تواصل مع الإدارة',    callback_data: 'contact_human' }],
        ]}
      }
    );
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
  }
});

// Messages
bot.on('message', (msg) => {
  const chatId  = msg.chat.id;
  const session = sessions[chatId];
  if (!session) return;

  if (session.step === 'ask_name' && msg.text) {
    session.data.name = msg.text.trim();
    session.step = 'ask_phone';
    bot.sendMessage(chatId, `👍 أهلاً *${session.data.name}*!\n\n*ما هو رقم هاتفك؟*`, { parse_mode: 'Markdown' });

  } else if (session.step === 'ask_phone' && msg.text) {
    session.data.phone = msg.text.trim();
    session.step = 'ask_interest';
    bot.sendMessage(chatId, `*ما هو اهتمامك الرئيسي؟*`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '📱 السوشيال ميديا',     callback_data: 'interest_social' }],
        [{ text: '🎨 الهوية البصرية',     callback_data: 'interest_branding' }],
        [{ text: '📈 الإعلانات المدفوعة', callback_data: 'interest_ads' }],
        [{ text: '🌐 المواقع والتطبيقات', callback_data: 'interest_web' }],
        [{ text: '💡 استشارة شاملة',      callback_data: 'interest_consult' }],
      ]}
    });

  } else if (session.step === 'awaiting_payment_screenshot' && msg.photo) {
    const fileId   = msg.photo[msg.photo.length - 1].file_id;
    const client   = getClient(msg.from.id);
    const userName = client ? client.name : (msg.from.first_name || 'غير مسجل');

    bot.sendMessage(chatId,
      `✅ *تم استلام إيصال الدفع!*\n\nسيتم التحقق منه والتواصل معك خلال ساعات. شكراً! 🙏`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
    );
    ADMINS.forEach(admin => {
      bot.sendPhoto(admin.id, fileId, {
        caption: `💰 *إيصال دفع جديد!*\n\n👤 ${userName}\n🆔 \`${msg.from.id}\`\n🕐 ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '✅ تأكيد الدفع وإبلاغ العميل', callback_data: `approve_pay_${msg.from.id}` }],
          [{ text: '❌ رفض الدفع',                 callback_data: `reject_pay_${msg.from.id}` }],
        ]},
      });
    });
    delete sessions[chatId];

  } else if (session.step === 'awaiting_payment_screenshot' && !msg.photo) {
    bot.sendMessage(chatId, `📸 من فضلك ابعت *صورة* الإيصال وليس نصاً.`, { parse_mode: 'Markdown' });
  }
});

console.log('✅ Horus Bot — شغّال!');
