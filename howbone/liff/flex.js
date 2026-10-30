/* 重慶骨科 LINE@ Flex 卡片範本（測試版）
 * 瀏覽器：window.Flex；Node：require('./flex.js')
 * 每張卡片都標明「看診人」，因為家族群上線後同一個 LINE 會收到多位家人的通知。
 */
(function (root) {
  var BLUE = '#004080', BLUE2 = '#0060a8', RED = '#d9534f', GOLD = '#f7b500', INK = '#333333', MUTED = '#888888';

  function txt(t, o) {
    var b = { type: 'text', text: String(t), wrap: true, size: 'md', color: INK };
    for (var k in (o || {})) b[k] = o[k];
    return b;
  }
  function row(label, value, o) {
    return {
      type: 'box', layout: 'baseline', spacing: 'md', contents: [
        txt(label, { size: 'sm', color: MUTED, flex: 2 }),
        txt(value, Object.assign({ size: 'md', flex: 5 }, o || {}))
      ]
    };
  }
  function btn(label, action, primary) {
    var a = action.uri ? { type: 'uri', label: label, uri: action.uri }
      : { type: 'message', label: label, text: action.text || label };
    return { type: 'button', style: primary ? 'primary' : 'secondary', color: primary ? RED : '#eef3f8', height: 'md', action: a };
  }
  function card(o) {
    var body = [];
    if (o.lead) body.push(txt(o.lead, { weight: 'bold', size: 'lg', color: o.leadColor || INK }));
    (o.rows || []).forEach(function (r) { body.push(row(r[0], r[1], r[2])); });
    if (o.big) body.push({
      type: 'box', layout: 'vertical', backgroundColor: BLUE, cornerRadius: '10px', paddingAll: '14px', contents: [
        txt(o.big.label, { size: 'sm', color: '#e1f0f6', align: 'center' }),
        txt(o.big.value, { size: '3xl', weight: 'bold', color: GOLD, align: 'center' })
      ]
    });
    if (o.note) body.push(txt(o.note, { size: 'sm', color: MUTED }));
    return {
      type: 'flex', altText: o.alt || o.title,
      contents: {
        type: 'bubble', size: 'mega',
        header: {
          type: 'box', layout: 'vertical', backgroundColor: o.headerColor || BLUE, paddingAll: '16px', contents: [
            txt('重慶骨科診所', { size: 'xs', color: '#cfe0f2' }),
            txt(o.title, { size: 'xl', weight: 'bold', color: '#ffffff' })
          ]
        },
        body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px', contents: body },
        footer: (o.buttons && o.buttons.length) ? { type: 'box', layout: 'vertical', spacing: 'sm', contents: o.buttons } : undefined
      }
    };
  }
  function who(d) { return d.patient + (d.relation && d.relation !== '本人' ? '（' + d.relation + '）' : ''); }
  function L(base, q) { return base ? base + (base.indexOf('?') >= 0 ? '&' : '?') + q : 'https://example.com/?' + q; }

  var F = {
    /* 加好友第 2 則：常用功能 */
    welcome: function (d) {
      d = d || {};
      return card({
        title: '常用功能', alt: '常用功能：綁定、掛號、看診進度、家族群',
        lead: (d.name || '您') + ' 您好，歡迎加入重慶骨科！',
        note: '第一次使用，請先花 1 分鐘綁定本人資料，之後掛號不用再填身分證。',
        buttons: [
          d.bound ? btn('幫我顧號碼', { uri: L(d.liff, 'tab=appts') }, true) : btn('綁定本人資料', { uri: L(d.liff, 'tab=bind') }, true),
          btn('我要掛號', { uri: L(d.liff, 'tab=book') }),
          btn('看診進度', { uri: L(d.liff, 'tab=home#queue') }),
          btn('建立家族群', { uri: L(d.liff, 'tab=family') })
        ]
      });
    },
    bookingSuccess: function (d) {
      return card({
        title: '掛號成功', alt: '掛號成功：' + d.patient + ' ' + d.date + ' ' + d.no + ' 號',
        rows: [['看診人', who(d), { weight: 'bold' }], ['日期', d.date + ' ' + d.apn + '診'], ['醫師', d.doctor]],
        big: { label: '您的號碼', value: d.no + ' 號' },
        note: '預計 ' + d.time + ' 看診。請於 ' + d.checkin + ' 前帶健保卡報到。' + (d.test ? '\n（測試版：此為模擬掛號，未送出至診所系統）' : ''),
        buttons: [
          btn('幫我顧號碼', { uri: L(d.liff, 'tab=appts') }, true),
          btn('地圖導航', { uri: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('325桃園市龍潭區中興路303號') })
        ]
      });
    },
    proxyBooked: function (d) {
      var c = F.bookingSuccess(d);
      c.altText = d.by + '幫您掛好號了';
      c.contents.header.contents[1].text = d.by + '幫您掛好號了';
      c.contents.body.contents.push(txt('由 ' + d.by + ' 於 ' + d.at + ' 代為掛號', { size: 'sm', color: BLUE2 }));
      return c;
    },
    remindDayBefore: function (d) {
      return card({
        title: '明天記得來看診', alt: '看診提醒：' + d.patient + ' 明天 ' + d.apn + '診',
        rows: [['看診人', who(d), { weight: 'bold' }], ['日期', d.date + ' ' + d.apn + '診'], ['醫師', d.doctor], ['號碼', d.no + ' 號']],
        note: '無法前來請提前取消，把名額留給需要的人。',
        buttons: [btn('我會到', { text: '我會到' }, true), btn('取消或改期', { uri: L(d.liff, 'tab=appts') })]
      });
    },
    remindToday: function (d) {
      return card({
        title: '今天' + d.apn + '診看診', alt: '今天看診：目前第 ' + d.led + ' 號，您是第 ' + d.no + ' 號',
        rows: [['看診人', who(d), { weight: 'bold' }], ['醫師', d.doctor]],
        big: { label: '目前第 ' + d.led + ' 號', value: '您是第 ' + d.no + ' 號' },
        buttons: [btn('開啟顧號碼', { uri: L(d.liff, 'tab=appts') }, true), btn('地圖導航', { uri: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('重慶骨科診所 龍潭') })]
      });
    },
    queueWatch: function (d) {
      return card({
        title: '快輪到了！', alt: d.patient + ' 的 ' + d.no + ' 號，還有 ' + (d.no - d.led) + ' 位', headerColor: RED,
        rows: [['看診人', who(d), { weight: 'bold' }]],
        big: { label: '目前叫到 ' + d.led + ' 號', value: '還有 ' + Math.max(0, d.no - d.led) + ' 位' },
        note: '您是 ' + d.no + ' 號。燈號更新於 ' + d.updated + '，請以現場為準。',
        buttons: [btn('重新整理', { uri: L(d.liff, 'tab=appts') }, true)]
      });
    },
    cancelled: function (d) {
      return card({
        title: '已取消預約', alt: '已取消：' + d.patient + ' ' + d.date,
        rows: [['看診人', who(d), { weight: 'bold' }], ['原預約', d.date + ' ' + d.apn + '診｜' + d.doctor]],
        buttons: [btn('重新掛號', { uri: L(d.liff, 'tab=book') }, true)]
      });
    },
    rescheduled: function (d) {
      return card({
        title: '改期完成', alt: '改期完成：' + d.patient,
        rows: [['看診人', who(d), { weight: 'bold' }], ['原', d.oldSlot, { color: MUTED, decoration: 'line-through' }], ['新', d.newSlot + '｜' + d.no + ' 號', { weight: 'bold' }]],
        buttons: [btn('查看預約', { uri: L(d.liff, 'tab=appts') }, true)]
      });
    },
    selfpaySuccess: function (d) {
      return card({
        title: '預約成功', alt: d.item + ' 預約成功', headerColor: BLUE2,
        rows: [['看診人', who(d), { weight: 'bold' }], ['項目', d.item + '（' + d.minutes + ' 分鐘）'], ['治療師', d.therapist], ['時間', d.date + ' ' + d.time], ['費用', d.price || '自費，費用請洽櫃檯']],
        note: '可於「我的預約」自行取消（每月 ' + d.limit + ' 次內）。',
        buttons: [btn('我的預約', { uri: L(d.liff, 'tab=appts') }, true)]
      });
    },
    selfpayRemind: function (d) {
      return card({
        title: '明天的' + d.item + '提醒', alt: '明天的' + d.item + '提醒', headerColor: BLUE2,
        rows: [['看診人', who(d), { weight: 'bold' }], ['時間', d.date + ' ' + d.time], ['治療師', d.therapist]],
        note: '請穿著方便露出治療部位的衣物。',
        buttons: [btn('我會到', { text: '我會到' }, true), btn('取消', { uri: L(d.liff, 'tab=appts') })]
      });
    },
    familyInvite: function (d) {
      return card({
        title: d.by + '邀請您加入家族群', alt: d.by + '邀請您加入「' + d.family + '」',
        lead: '「' + d.family + '」',
        note: '加入後，家人可幫您掛號、收到您的看診提醒。您可隨時退出。連結 72 小時內有效。',
        buttons: [btn('查看並加入', { uri: L(d.liff, 'tab=family&invite=' + d.code) }, true)]
      });
    },
    nightQueue: function (d) {
      return card({
        title: '昨晚的申請已處理', alt: '昨晚的' + d.action + '申請：' + d.result,
        rows: [['看診人', who(d), { weight: 'bold' }], ['申請', d.action], ['結果', d.result, { weight: 'bold', color: d.ok ? '#2e7d32' : RED }]],
        buttons: [btn('查看預約', { uri: L(d.liff, 'tab=appts') }, true), btn('聯絡客服', { text: '客服' })]
      });
    }
  };

  /* 範例資料：給 Flex Simulator 與匯出 JSON 用 */
  F.samples = {
    welcome: { name: '王小美' },
    bookingSuccess: { patient: '王小美', relation: '本人', date: '11/3（一）', apn: '早', doctor: '黃頌評 院長', no: 12, time: '09:35', checkin: '09:20' },
    proxyBooked: { patient: '王大明', relation: '兒子', date: '11/4（二）', apn: '晚', doctor: '黃頌評 院長', no: 8, time: '18:50', checkin: '18:35', by: '王小美', at: '10/30 14:05' },
    remindDayBefore: { patient: '王阿公', relation: '父親', date: '11/5（三）', apn: '早', doctor: '陳明峰 主治醫師', no: 5 },
    remindToday: { patient: '王小美', relation: '本人', apn: '早', doctor: '黃頌評 院長', led: 3, no: 12 },
    queueWatch: { patient: '王小美', relation: '本人', led: 7, no: 12, updated: '09:12' },
    cancelled: { patient: '王小寶', relation: '子女', date: '11/6（四）', apn: '午', doctor: '陳明峰 主治醫師' },
    rescheduled: { patient: '王小美', relation: '本人', oldSlot: '11/3（一）早診', newSlot: '11/6（四）早診', no: 6 },
    selfpaySuccess: { patient: '王小美', relation: '本人', item: '震波治療', minutes: 20, therapist: '林治療師', date: '11/7（五）', time: '15:00', limit: 2 },
    selfpayRemind: { patient: '王小美', relation: '本人', item: '震波治療', therapist: '林治療師', date: '11/7（五）', time: '15:00' },
    familyInvite: { by: '王小美', family: '王家', code: 'DEMO1234' },
    nightQueue: { patient: '王小美', relation: '本人', action: '掛號 11/3（一）早診', result: '成功，12 號', ok: true }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F; else root.Flex = F;
})(this);
