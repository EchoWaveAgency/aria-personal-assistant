// ============================================================
//  EchoWave Agency Bot — المرحلة الأولى الكاملة
//  المميزات: ترحيب | إشعار أدمن | تسجيل عميل | تأكيد دفع
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs          = require('fs');
const path        = require('path');

// ─── الإعدادات ───────────────────────────────────────────────
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';         // ← حط التوكن بتاعك هنا

// الأدمنز — كل الإشعارات بتوصل للاتنين
const ADMINS = [
  { id: 975804661,  name: 'عمرو'  },   // @AMREllaban
  { id: 1036943414, name: 'آلاء'  },   // allaa hamdy
];

// دالة مساعدة — بتبعت رسالة لكل الأدمنز
function notifyAdmins(text, options = {}) {
  ADMINS.forEach(admin => bot.sendMessage(admin.id, text, options));
}

const DB_FILE = path.join(__dirname, 'clients.json');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ─── قاعدة البيانات المحلية (JSON) ───────────────────────────
function loadDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ clients: [] }));
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function saveClient(client) {
  const db = loadDB();
  const existing = db.clients.findIndex(c => c.telegramId === client.telegramId);
  if (existing >= 0) {
    db.clients[existing] = { ...db.clients[existing], ...client };
  } else {
    db.clients.push({ ...client, joinedAt: new Date().toISOString() });
  }
  saveDB(db);
}

function getClient(telegramId) {
  return loadDB().clients.find(c => c.telegramId === telegramId);
}

// ─── حالات المحادثة (لتسجيل بيانات العميل) ──────────────────
const sessions = {};   // { chatId: { step, data } }

// ─── القائمة الرئيسية ─────────────────────────────────────────
const mainButtons = [
  [{ text: '🏛️ خدماتنا الاستراتيجية',       callback_data: 'show_all_details' }],
  [{ text: '🔗 بوابة الروابط (Linktree)',    url: 'https://linktr.ee/echowaveagency' }],
  [{ text: '💳 الدفع والتحصيل (InstaPay)',   callback_data: 'payment_menu' }],
  [{ text: '👁️ طلب تحليل لمشروعك',          callback_data: 'form_audit' }],
  [{ text: '📝 تسجيل بياناتك',              callback_data: 'register_client' }],
  [{ text: '📞 تواصل مع الإدارة',            callback_data: 'contact_human' }],
];

function sendMainMenu(chatId, text) {
  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: mainButtons },
  });
}

// ─── /start ───────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chatId   = msg.chat.id;
  const userId   = msg.from.id;
  const userName = msg.from.first_name || 'عزيزي';
  const username = msg.from.username ? `@${msg.from.username}` : 'لا يوجد';

  // 1️⃣ ترحيب مخصص باسم العميل
  const welcome =
    `👁️ *أهلاً وسهلاً ${userName}!*\n\n` +
    `مرحباً بك في *EchoWave Agency* — وكالتك الاستراتيجية المتكاملة.\n\n` +
    `نحن هنا لنساعدك في بناء حضورك الرقمي وتحقيق أهدافك التسويقية.\n\n` +
    `اختر من القائمة 👇`;

  sendMainMenu(chatId, welcome);

  // 2️⃣ إشعار فوري للأدمنز
  const adminMsg =
    `🔔 *عميل جديد دخل البوت!*\n\n` +
    `👤 الاسم: ${msg.from.first_name || ''} ${msg.from.last_name || ''}\n` +
    `🔗 يوزر: ${username}\n` +
    `🆔 ID: \`${userId}\`\n` +
    `🕐 الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`;

  notifyAdmins(adminMsg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '💬 رد عليه مباشرة', url: `tg://user?id=${userId}` },
      ]],
    },
  });
});

// ─── أزرار القائمة ─────────────────────────────────────────────
bot.on('callback_query', (query) => {
  const chatId    = query.message.chat.id;
  const messageId = query.message.message_id;
  const action    = query.data;
  const userId    = query.from.id;
  const userName  = query.from.first_name || 'عزيزي';

  bot.answerCallbackQuery(query.id);

  // ── القائمة الرئيسية ──
  if (action === 'main_menu') {
    bot.editMessageText(
      `👁️ *القائمة الرئيسية — EchoWave Agency*\n\nاختر الخدمة التي تريدها:`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: mainButtons } }
    );
  }

  // ── منيو الدفع ──
  else if (action === 'payment_menu') {
    const payMsg =
      `💳 *قنوات الاستثمار الآمن لـ EchoWave:*\n\n` +
      `يرجى اختيار وسيلة الدفع المناسبة:\n\n` +
      `📌 _بعد الدفع اضغط "تأكيد الدفع" وابعت صورة الإيصال_`;

    const payBtns = [
      [{ text: '💳 InstaPay (عمرو)',  url: 'https://ipn.eg/S/amrellaban_83/instapay/7ZsBhb' }],
      [{ text: '💳 InstaPay (آلاء)', url: 'https://ipn.eg/S/alaahassanin2025/instapay/0xMnFV' }],
      [{ text: '✅ تأكيد الدفع',      callback_data: 'confirm_payment' }],
      [{ text: '⬅️ عودة للقائمة',    callback_data: 'main_menu' }],
    ];

    bot.editMessageText(payMsg, {
      chat_id: chatId, message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: payBtns },
    });
  }

  // ── تأكيد الدفع ──
  else if (action === 'confirm_payment') {
    sessions[chatId] = { step: 'awaiting_payment_screenshot' };
    bot.sendMessage(chatId,
      `✅ *ممتاز!*\n\nمن فضلك ابعت *صورة إيصال الدفع* الآن وسيتم التحقق منها في أقرب وقت.`,
      { parse_mode: 'Markdown' }
    );
  }

  // ── تسجيل بيانات العميل ──
  else if (action === 'register_client') {
    const existing = getClient(userId);
    if (existing && existing.phone) {
      bot.sendMessage(chatId,
        `✅ *أنت مسجل بالفعل!*\n\n` +
        `👤 الاسم: ${existing.name}\n📱 الهاتف: ${existing.phone}\n🎯 الاهتمام: ${existing.interest}`,
        { parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
      );
      return;
    }
    sessions[chatId] = { step: 'ask_name', data: { telegramId: userId, username: query.from.username || '' } };
    bot.sendMessage(chatId,
      `📝 *تسجيل بياناتك*\n\nيسعدنا التواصل معك!\n\n*ما هو اسمك الكريم؟*`,
      { parse_mode: 'Markdown' }
    );
  }

  // ── طلب تحليل ──
  else if (action === 'form_audit') {
    bot.editMessageText(
      `👁️ *طلب تحليل مجاني لمشروعك*\n\n` +
      `فريقنا سيقوم بتحليل شامل لحضورك الرقمي وتقديم توصيات استراتيجية.\n\n` +
      `📩 للطلب تواصل معنا مباشرة:`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '💬 تواصل مع الفريق', callback_data: 'contact_human' }],
          [{ text: '⬅️ عودة للقائمة',   callback_data: 'main_menu' }],
        ]}
      }
    );
  }

  // ── تواصل مع الإدارة ──
  else if (action === 'contact_human') {
    bot.editMessageText(
      `📞 *التواصل مع إدارة EchoWave*\n\n` +
      `تم إرسال طلبك للإدارة، سيتواصل معك أحد أعضاء الفريق في أقرب وقت ممكن.\n\n` +
      `⏰ أوقات العمل: 9 صباحاً — 11 مساءً`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ عودة للقائمة', callback_data: 'main_menu' }]] } }
    );

    // إشعار الأدمنز
    notifyAdmins(
      `📞 *طلب تواصل جديد!*\n\n` +
      `👤 ${query.from.first_name || ''} ${query.from.last_name || ''}\n` +
      `🆔 \`${userId}\``,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '💬 رد عليه', url: `tg://user?id=${userId}` }]] } }
    );
  }
});

// ─── معالجة الرسائل النصية والصور (لسير التسجيل والدفع) ──────
bot.on('message', (msg) => {
  const chatId  = msg.chat.id;
  const session = sessions[chatId];
  if (!session) return;

  // ── سير تسجيل بيانات العميل ──
  if (session.step === 'ask_name' && msg.text) {
    session.data.name = msg.text.trim();
    session.step = 'ask_phone';
    bot.sendMessage(chatId, `👍 أهلاً *${session.data.name}*!\n\n*ما هو رقم هاتفك؟*`, { parse_mode: 'Markdown' });

  } else if (session.step === 'ask_phone' && msg.text) {
    session.data.phone = msg.text.trim();
    session.step = 'ask_interest';
    bot.sendMessage(chatId,
      `*ما هو اهتمامك الرئيسي؟*`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '📱 السوشيال ميديا',        callback_data: 'interest_social' }],
          [{ text: '🎨 الهوية البصرية',        callback_data: 'interest_branding' }],
          [{ text: '📈 الإعلانات المدفوعة',    callback_data: 'interest_ads' }],
          [{ text: '🌐 المواقع والتطبيقات',    callback_data: 'interest_web' }],
          [{ text: '💡 استشارة شاملة',         callback_data: 'interest_consult' }],
        ]}
      }
    );

  } else if (session.step === 'awaiting_payment_screenshot' && msg.photo) {
    // ── تأكيد الدفع بالصورة ──
    const fileId   = msg.photo[msg.photo.length - 1].file_id;
    const client   = getClient(msg.from.id);
    const userName = client ? client.name : (msg.from.first_name || 'غير مسجل');

    bot.sendMessage(chatId,
      `✅ *تم استلام إيصال الدفع!*\n\nسيتم التحقق منه والتواصل معك خلال ساعات قليلة. شكراً لثقتك! 🙏`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
    );

    // إرسال الصورة للأدمنز مع التفاصيل
    ADMINS.forEach(admin => {
      bot.sendPhoto(admin.id, fileId, {
        caption:
          `💰 *إيصال دفع جديد!*\n\n` +
          `👤 الاسم: ${userName}\n` +
          `🆔 ID: \`${msg.from.id}\`\n` +
          `🕐 الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
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

// ─── اهتمام العميل (callback من أزرار التسجيل) ───────────────
const interestMap = {
  interest_social:   'السوشيال ميديا',
  interest_branding: 'الهوية البصرية',
  interest_ads:      'الإعلانات المدفوعة',
  interest_web:      'المواقع والتطبيقات',
  interest_consult:  'استشارة شاملة',
};

bot.on('callback_query', (query) => {
  const chatId  = query.message.chat.id;
  const action  = query.data;
  const session = sessions[chatId];

  // ── حفظ اهتمام العميل ──
  if (interestMap[action] && session && session.step === 'ask_interest') {
    bot.answerCallbackQuery(query.id);
    session.data.interest = interestMap[action];

    // حفظ في الملف
    saveClient(session.data);
    delete sessions[chatId];

    bot.sendMessage(chatId,
      `🎉 *تم تسجيل بياناتك بنجاح!*\n\n` +
      `👤 الاسم: ${session.data.name}\n` +
      `📱 الهاتف: ${session.data.phone}\n` +
      `🎯 الاهتمام: ${session.data.interest}\n\n` +
      `سيتواصل معك فريقنا قريباً! 🚀`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ القائمة الرئيسية', callback_data: 'main_menu' }]] } }
    );

    // إشعار الأدمنز بعميل جديد مسجل
    notifyAdmins(
      `📋 *عميل جديد سجّل بياناته!*\n\n` +
      `👤 الاسم: ${session.data.name}\n` +
      `📱 الهاتف: ${session.data.phone}\n` +
      `🎯 الاهتمام: ${session.data.interest}\n` +
      `🆔 Telegram ID: \`${session.data.telegramId}\``,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '💬 تواصل معه', url: `tg://user?id=${session.data.telegramId}` }]] } }
    );
  }

  // ── أدمن يوافق على الدفع ──
  if (action.startsWith('approve_pay_')) {
    bot.answerCallbackQuery(query.id, { text: '✅ تم إرسال التأكيد للعميل' });
    const clientId = parseInt(action.replace('approve_pay_', ''));
    bot.sendMessage(clientId,
      `✅ *تم تأكيد دفعتك بنجاح!*\n\nشكراً لثقتك في EchoWave Agency، سيتواصل معك فريقنا خلال 24 ساعة لبدء العمل. 🚀`,
      { parse_mode: 'Markdown' }
    );
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    });
  }

  // ── أدمن يرفض الدفع ──
  if (action.startsWith('reject_pay_')) {
    bot.answerCallbackQuery(query.id, { text: '❌ تم إرسال الرفض للعميل' });
    const clientId = parseInt(action.replace('reject_pay_', ''));
    bot.sendMessage(clientId,
      `❌ *لم يتم التحقق من إيصال الدفع*\n\nمن فضلك تأكد من أن الصورة واضحة وأن الدفع تم بشكل صحيح، ثم أعد الإرسال أو تواصل مع الإدارة.`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '🔄 إعادة إرسال الإيصال', callback_data: 'confirm_payment' }],
          [{ text: '📞 تواصل مع الإدارة',    callback_data: 'contact_human' }],
        ]}
      }
    );
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    });
  }
});

// ─── أمر /myid لمعرفة الـ Telegram ID ────────────────────────
bot.onText(/\/myid/, (msg) => {
  bot.sendMessage(msg.chat.id, `🆔 الـ Telegram ID بتاعك: \`${msg.from.id}\``, { parse_mode: 'Markdown' });
});

console.log('✅ EchoWave Bot — المرحلة الأولى شغّالة!');
