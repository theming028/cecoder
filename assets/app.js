(function () {
  var toastWrap = document.getElementById('toastWrap');
  var frame = document.querySelector('.cds-frame');

  /* ---------- 第 30 轮：三个独立页面（首页 / 会话 / 任务） ---------- */
  var PAGE = document.body.getAttribute('data-page') || 'home';
  var QS = new URLSearchParams(location.search);
  function pageUrl(name, params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== '' && params[k] != null) q.set(k, params[k]);
    });
    var qs = q.toString();
    return name + '.html' + (qs ? '?' + qs : '');
  }
  function replaceUrl(name, params) {
    try { history.replaceState(null, '', pageUrl(name, params)); } catch (err) {}
  }
  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'semi-toast';
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }

  /* ---------- 顶部分段控件：底板滑动（.seg-pill 位移 + 变宽） ---------- */
  var seg = document.querySelector('.tb-seg');
  var segPill = document.getElementById('segPill');
  function moveSegPill(anim) {
    if (!seg || !segPill) return;
    var on = seg.querySelector('.seg-item.is-active');
    if (!on) return;
    if (!anim) seg.classList.add('no-anim');
    segPill.style.width = on.offsetWidth + 'px';
    segPill.style.transform = 'translateX(' + (on.offsetLeft - 2) + 'px)';
    if (!anim) { void segPill.offsetWidth; seg.classList.remove('no-anim'); }
  }
  seg.querySelectorAll('.seg-item').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.classList.contains('is-active')) return;
      seg.querySelectorAll('.seg-item').forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      b.classList.add('is-active');
      b.setAttribute('aria-selected', 'true');
      moveSegPill(true);
    });
  });
  moveSegPill(false);
  window.addEventListener('resize', function () { moveSegPill(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveSegPill(false); });

  /* ---------- chip 单选：工作台 / 快速任务 各自一组 ---------- */
  var wbSlot = document.getElementById('wbSlot');
  var wbOpts = document.getElementById('wbOpts');
  var qfSlot = document.getElementById('qfSlot');
  var qfBar = document.getElementById('qfBar');
  var qfFlow = document.getElementById('qfFlow');
  var qfTrack = document.getElementById('qfTrack');
  var qfTitle = document.getElementById('qfTitle');
  var qfEditBtn = document.getElementById('qfEdit');
  var tplArrow = document.getElementById('tplQfArrow');

  /* 工序真值：技术任务 8 道取自 layers/quick-flow.json（2960:44863） */
  var QF_STEPS = {
    '技术任务': ['概要设计', '详细设计', '程序设计', '代码开发', '代码审查', '白盒测试', '提交流水线', '交付确认'],
    '缺陷修复': ['问题复现', '根因定位', '修复实现', '回归验证'],
    '需求编写': ['需求澄清', '需求分析', '需求文档', '评审确认'],
    '需求优化': ['现状梳理', '优化方案', '方案评审', '落地实施']
  };
  var qfTask = '技术任务';
  var qfSteps = QF_STEPS['技术任务'].slice();

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function qfRender() {
    qfFlow.textContent = '';
    qfSteps.forEach(function (name, i) {
      var step = document.createElement('div');
      step.className = 'qf-step' + (i === 0 ? ' is-active' : '');
      step.setAttribute('role', 'button');
      step.tabIndex = 0;
      step.dataset.i = i;
      var no = document.createElement('span');
      no.className = 'qf-no';
      no.textContent = pad2(i + 1);
      var nm = document.createElement('span');
      nm.className = 'qf-name';
      nm.textContent = name;
      step.appendChild(no); step.appendChild(nm);
      qfFlow.appendChild(step);
      if (i < qfSteps.length - 1) qfFlow.appendChild(tplArrow.content.firstElementChild.cloneNode(true));
    });
    qfTitle.textContent = qfTask + ' · ' + qfSteps.length + ' 道';
    qfMeasure();
  }

  function qfMeasure() {
    if (!qfTrack) return;
    qfTrack.classList.toggle('is-scroll', qfTrack.scrollWidth - qfTrack.clientWidth > 1);
  }

  /* 六个工作台各自一套子项（「通用」取自稿件 dy2983:48726，其余按同一体系补全） */
  var WB_OPTS = {
    '通用': ['PPT 编写', '汇报材料', '思路整理', '挑战我'],
    '需求': ['需求澄清', '用户故事', '验收标准', '竞品对标'],
    '架构': ['技术选型', '系统设计', '数据模型', '接口契约'],
    '交互': ['流程梳理', '原型说明', '状态与异常', '文案打磨'],
    '开发': ['编码实现', '代码审查', '重构治理', '单测补齐'],
    '测试': ['用例设计', '缺陷复现', '回归清单', '性能验证']
  };
  var wbPick = {};       /* 每个工作台各自记住选中的子项 */
  var wbCur = '';

  function wbRender() {
    var list = WB_OPTS[wbCur] || [];
    var pick = wbPick[wbCur];
    if (list.indexOf(pick) < 0) pick = list[0];
    wbPick[wbCur] = pick;
    wbOpts.textContent = '';
    list.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wb-opt' + (name === pick ? ' is-active' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', name === pick ? 'true' : 'false');
      b.textContent = name;
      b.addEventListener('click', function () { wbPick[wbCur] = name; wbRender(); renderTags(); });
      wbOpts.appendChild(b);
    });
  }

  function syncBars() {
    var wbChip = document.querySelector('[data-chips="process"] .chip.is-active');
    var wbName = wbChip ? wbChip.dataset.wb : '';
    /* 第 8 轮：六种工作台各有自己的「选择子项」，切 tab 就换一套 */
    if (wbName && wbName !== wbCur) { wbCur = wbName; wbRender(); }
    wbSlot.classList.toggle('is-open', !!wbName);

    var qfChip = document.querySelector('[data-chips="quick"] .chip.is-active');
    var qfName = qfChip ? qfChip.dataset.quick : '';
    if (qfName) {
      if (qfTask !== qfName) {
        qfTask = qfName;
        qfSteps = (QF_STEPS[qfName] || ['澄清', '执行', '验收']).slice();
      }
      qfRender();
    }
    qfSlot.classList.toggle('is-open', !!qfName);
    renderTags();
    syncStageScroll();
  }

  /* ---------- 第 31 轮：输入卡里的「已选类型」标签 ----------
     快速任务 → 紫色标签（文本 = 任务类型）；工作台 → 蓝色标签（文本 = 工作台 · 子项）。
     两者互斥（chip 组本身互斥），关掉标签等于取消上面的选中态。 */
  var cTags = document.getElementById('cTags');
  var composerBox = document.querySelector('.composer');
  var WB_FULL = {
    '通用': '通用工作台', '需求': '需求分析工作台', '架构': '架构设计工作台',
    '交互': '交互设计工作台', '开发': '开发工作台', '测试': '测试工作台'
  };
  var TAG_X = '<span class="ico ico12"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3.6 3.6L8.4 8.4M8.4 3.6L3.6 8.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></span>';

  function clearChip(groupSel) {
    var c = document.querySelector(groupSel);
    if (c) c.classList.remove('is-active');
    syncBars();
  }

  function renderTags() {
    if (!cTags) return;
    var wbChip = document.querySelector('[data-chips="process"] .chip.is-active');
    var qfChip = document.querySelector('[data-chips="quick"] .chip.is-active');
    var items = [];
    if (qfChip) items.push({ kind: 'quick', text: qfChip.dataset.quick || '' });
    if (wbChip) {
      var wb = wbChip.dataset.wb || '';
      var sub = wbPick[wb] || '';
      items.push({ kind: 'wb', text: (WB_FULL[wb] || wb) + (sub ? ' · ' + sub : '') });
    }

    cTags.textContent = '';
    items.forEach(function (it) {
      var tag = document.createElement('span');
      tag.className = 'c-tag ' + (it.kind === 'quick' ? 'is-quick' : 'is-wb');
      var txt = document.createElement('span');
      txt.className = 'c-tag-txt';
      txt.textContent = it.text;
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'c-tag-x';
      x.setAttribute('aria-label', '移除 ' + it.text);
      x.innerHTML = TAG_X;
      x.addEventListener('click', function () {
        clearChip(it.kind === 'quick'
          ? '[data-chips="quick"] .chip.is-active'
          : '[data-chips="process"] .chip.is-active');
      });
      tag.appendChild(txt);
      tag.appendChild(x);
      cTags.appendChild(tag);
    });

    var on = items.length > 0;
    var changed = cTags.hidden === on;      /* 由「有」变「无」或反过来 */
    cTags.hidden = !on;
    if (composerBox) composerBox.classList.toggle('has-tags', on);
    if (changed && typeof ciGrow === 'function' && ta) ciGrow();
  }

  /* 工作台 / 快速任务是互斥的两组：同时只能有一组带选中 */
  document.querySelectorAll('[data-chips]').forEach(function (group) {
    group.querySelectorAll('.chip:not(.chip-new)').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.classList.contains('is-active');
        group.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('is-active'); });
        if (!on) {
          document.querySelectorAll('[data-chips]').forEach(function (other) {
            if (other === group) return;
            other.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('is-active'); });
          });
          b.classList.add('is-active');
        }
        syncBars();
      });
    });
  });

  /* 容器右上「关闭」：取消对应的选中 */
  document.querySelectorAll('[data-bar-close]').forEach(function (b) {
    b.addEventListener('click', function () {
      var sel = b.dataset.barClose === 'wb'
        ? '[data-chips="process"] .chip.is-active'
        : '[data-chips="quick"] .chip.is-active';
      var c = document.querySelector(sel);
      if (c) c.classList.remove('is-active');
      syncBars();
    });
  });

  /* 子项单选：由 wbRender() 动态绑定（见上） */

  /* 工序：点击「编辑」→ 打开独立的编辑弹窗（不再切行内编辑态） */
  var qfModal = document.getElementById('qfModal');
  var qmList = document.getElementById('qmList');
  var qmAddBtn = document.getElementById('qmAdd');
  var qmSaveBtn = document.getElementById('qmSave');
  var qmSub = document.getElementById('qmSub');
  var qmDraft = [];
  var closeIco = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.2 4.2L11.8 11.8M11.8 4.2L4.2 11.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function qmRender() {
    qmList.textContent = '';
    qmDraft.forEach(function (name, i) {
      var row = document.createElement('div');
      row.className = 'qm-row';
      var no = document.createElement('span');
      no.className = 'qm-no';
      no.textContent = pad2(i + 1);
      var inp = document.createElement('input');
      inp.className = 'qm-input';
      inp.type = 'text';
      inp.value = name;
      inp.setAttribute('aria-label', '第 ' + (i + 1) + ' 道工序');
      inp.addEventListener('input', function () { qmDraft[i] = inp.value; });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'qm-del';
      del.setAttribute('aria-label', '删除工序 ' + (i + 1));
      del.innerHTML = '<span class="ico ico12">' + closeIco + '</span>';
      del.addEventListener('click', function () {
        qmDraft.splice(i, 1);
        qmRender();
        var ins = qmList.querySelectorAll('.qm-input');
        if (ins.length) ins[Math.min(i, ins.length - 1)].focus();
      });
      row.appendChild(no); row.appendChild(inp); row.appendChild(del);
      qmList.appendChild(row);
    });
    qmSub.textContent = qfTask + ' · ' + qmDraft.filter(function (s) { return s.trim(); }).length + ' 道';
    qmSaveBtn.disabled = !qmDraft.some(function (s) { return s.trim(); });
  }

  function qfOpenEdit() {
    qmDraft = qfSteps.slice();
    qmRender();
    openCdsModal(qfModal);
    setTimeout(function () {
      var inp = qmList.querySelector('.qm-input');
      if (inp) inp.focus();
      else qmAddBtn.focus();
    }, 30);
  }

  /* 第 13 轮：编辑工序图标点击先不弹窗（「编辑工序」弹窗的代码保留在 qfOpenEdit，
     后续要接线只需恢复下面这行；图标本身仍是可聚焦的 button） */
  // if (qfEditBtn) qfEditBtn.addEventListener('click', qfOpenEdit);

  qmAddBtn.addEventListener('click', function () {
    qmDraft.push('新工序');
    qmRender();
    var ins = qmList.querySelectorAll('.qm-input');
    var last = ins[ins.length - 1];
    if (last) { last.focus(); last.select(); }
    qmList.scrollTop = qmList.scrollHeight;
  });

  qmSaveBtn.addEventListener('click', function () {
    var next = qmDraft.map(function (s) { return s.trim(); }).filter(Boolean);
    if (!next.length) return;
    qfSteps = next;
    qfRender();
    closeCdsModal(qfModal);
    toast('工序已更新');
  });

  /* 弹窗里回车 = 追加下一道（和笔记类表单一致），不提交 */
  qmList.addEventListener('keydown', function (e) {
    var inp = e.target.closest('.qm-input');
    if (!inp) return;
    if (e.key === 'Enter') { e.preventDefault(); qmAddBtn.click(); }
  });

  if (qfFlow) {
    qfFlow.addEventListener('click', function (e) {
      var step = e.target.closest('.qf-step');
      if (!step) return;
      qfFlow.querySelectorAll('.qf-step').forEach(function (x) { x.classList.remove('is-active'); });
      step.classList.add('is-active');
    });
  }
  window.addEventListener('resize', qfMeasure);

  /* ---------- 下拉：展开 / 选择 / 点外部关闭 ---------- */
  document.querySelectorAll('.cds-dd').forEach(function (dd) {
    var trigger = dd.querySelector('button');
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.contains('is-open');
      document.querySelectorAll('.cds-dd.is-open').forEach(function (x) { x.classList.remove('is-open'); });
      if (!open) {
        dd.classList.add('is-open');
        // 横向钳制：展开后若右溢，改成右对齐展开
        var list = dd.querySelector('.semi-select-option-list-wrapper');
        if (list) {
          dd.classList.remove('dd-right');
          var r = list.getBoundingClientRect();
          if (r.right > window.innerWidth - 8) dd.classList.add('dd-right');
        }
      }
    });
    dd.querySelectorAll('.semi-select-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        /* 第 66 轮：参考代码源（本地目录）下拉 —— 选中回填触发器；末项调起系统目录选择 */
        if (dd.dataset.dd === 'refsrc') { cRefPickOption(dd, opt); return; }
        /* 第 16 轮：工作目录下拉里的「选择其他目录…」不参与选中态，直接调起系统文件夹选择窗口 */
        if (dd.dataset.dd === 'dir' && /选择其他目录/.test(opt.textContent)) {
          dd.classList.remove('is-open');
          cPickDirectory();
          return;
        }
        var label = dd.querySelector('.c-pill-txt');
        dd.querySelectorAll('.semi-select-option').forEach(function (x) { x.classList.remove('semi-select-option-selected'); });
        opt.classList.add('semi-select-option-selected');
        if (label) label.textContent = opt.textContent;
        /* 第 14 轮：完全访问权限 = 高风险，药丸触发器与选项都转红 */
        if (dd.dataset.dd === 'perm') {
          var risk = opt.dataset.risk === '1' || /完全访问/.test(opt.textContent);
          dd.querySelector('.c-perm').classList.toggle('is-risk', risk);
        }
        dd.classList.remove('is-open');
        toast(opt.textContent);
      });
    });
  });

  /* 第 16 轮：系统文件夹选择（工作目录下拉「选择其他目录…」）。
     同抽屉「添加工作目录」的套路：showDirectoryPicker 拿真实目录名，
     file:// 等受限环境退回 input[webkitdirectory]。
     命名 c* 前缀防撞：本 IIFE 后段已有 var dirPick（wdDirPick） */
  var cDirPick = document.getElementById('dirPick');
  /* 第 66 轮：系统目录选择要给谁回填 —— 首页/任务页底部「工作目录」是默认目标，
     参考代码源下拉会把它自己传进来（null = 工作目录） */
  var cDirTarget = null;

  /* 参考代码源下拉：点选项只回填触发器；末项「选择其他目录」走系统目录选择 */
  function cRefPickOption(dd, opt) {
    dd.classList.remove('is-open');
    if (opt.classList.contains('semi-select-option-tail')) { cPickDirectory(dd); return; }
    var v = dd.querySelector('.tp-sel-v');
    if (v) { v.textContent = opt.textContent; v.classList.remove('is-ph'); }
    dd.querySelectorAll('.semi-select-option').forEach(function (x) {
      x.classList.remove('semi-select-option-selected');
    });
    opt.classList.add('semi-select-option-selected');
    toast('参考代码源：' + opt.textContent);
  }

  /* 系统选完的目录要能进「最近使用」：置顶一条，列表只留 3 条（末项固定是「选择其他目录」） */
  function cRefInsert(dd, folder) {
    var list = dd.querySelector('.semi-select-option-list-wrapper');
    var hit = null;
    dd.querySelectorAll('.semi-select-option').forEach(function (x) {
      if (!x.classList.contains('semi-select-option-tail') && x.textContent === folder) hit = x;
    });
    if (!hit) {
      hit = document.createElement('li');
      hit.className = 'semi-select-option';
      hit.setAttribute('role', 'option');
      hit.textContent = folder;
      hit.addEventListener('click', function () { cRefPickOption(dd, hit); });
      list.insertBefore(hit, list.firstChild);
      var items = dd.querySelectorAll('.semi-select-option:not(.semi-select-option-tail)');
      for (var i = 3; i < items.length; i++) items[i].parentNode.removeChild(items[i]);
    }
    cRefPickOption(dd, hit);
  }

  function cApplyDir(folder) {
    var dd = cDirTarget || document.querySelector('.cds-dd[data-dd="dir"]');
    cDirTarget = null;
    if (dd && dd.dataset.dd === 'refsrc') { cRefInsert(dd, folder); return; }
    if (dd) {
      var opts = dd.querySelectorAll('.semi-select-option');
      opts.forEach(function (x) { x.classList.remove('semi-select-option-selected'); });
      if (opts.length) {
        opts[0].textContent = folder;
        opts[0].classList.add('semi-select-option-selected');
      }
      var label = dd.querySelector('.c-pill-txt');
      if (label) label.textContent = folder;
    }
    toast('已切换工作目录：' + folder);
  }

  async function cPickDirectory(target) {
    cDirTarget = target || null;
    if (window.showDirectoryPicker) {
      try {
        var handle = await window.showDirectoryPicker({ id: 'cecoder-workdir', mode: 'read' });
        if (handle && handle.name) { cApplyDir(handle.name); return; }
      } catch (err) {
        if (err && err.name === 'AbortError') { cDirTarget = null; return; }  // 用户自己取消
        /* SecurityError 等（file:// 受限）→ 退回 input[webkitdirectory] */
      }
    }
    if (cDirPick) cDirPick.click();
  }

  if (cDirPick) {
    cDirPick.addEventListener('change', function () {
      if (!cDirPick.files || !cDirPick.files.length) return;
      var rel = cDirPick.files[0].webkitRelativePath || cDirPick.files[0].name;
      cApplyDir(rel.split('/')[0] || rel);
      cDirPick.value = '';
    });
  }
  /* 第 16 轮：加号菜单「添加本地文件」 → 系统文件选择窗口（可多选） */
  var filePick = document.getElementById('filePick');
  if (filePick) {
    filePick.addEventListener('change', function () {
      var n = filePick.files ? filePick.files.length : 0;
      if (n) toast('已添加 ' + n + ' 个本地文件');
      filePick.value = '';
    });
  }
  document.addEventListener('click', function () {
    document.querySelectorAll('.cds-dd.is-open').forEach(function (x) { x.classList.remove('is-open'); });
    closeCardMenu();
    closeAttachMenu();
  });

  /* ---------- 第 16 轮：输入区加号菜单（添加本地文件 / 技能），按钮上方弹出 ---------- */
  var attachBtn = document.getElementById('attachBtn');
  var attachMenu = document.getElementById('attachMenu');

  function closeAttachMenu() {
    if (!attachMenu || attachMenu.hidden) return;
    attachMenu.hidden = true;
    if (attachBtn) {
      attachBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openAttachMenu() {
    if (!attachMenu || !attachBtn) return;
    closeCardMenu();
    attachMenu.hidden = false;
    attachBtn.setAttribute('aria-expanded', 'true');
    /* fixed 定位：贴按钮左缘、弹在按钮上方；上方放不下才落回下方 */
    var r = attachBtn.getBoundingClientRect();
    var w = attachMenu.offsetWidth, h = attachMenu.offsetHeight;
    var left = Math.max(8, Math.min(Math.round(r.left), window.innerWidth - w - 8));
    var top = Math.round(r.top - h - 6);
    if (top < 8) top = Math.round(r.bottom + 6);
    attachMenu.style.left = left + 'px';
    attachMenu.style.top = top + 'px';
    var first = attachMenu.querySelector('.wd-menu-item');
    if (first) first.focus({ preventScroll: true });
  }

  if (attachBtn && attachMenu) {
    attachBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!attachMenu.hidden) { closeAttachMenu(); return; }
      openAttachMenu();
    });
    attachMenu.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = e.target.closest('.wd-menu-item');
      if (!item) return;
      closeAttachMenu();
      if (item.dataset.attach === 'file') {
        if (filePick) filePick.click();
      } else {
        toast('技能');
      }
    });
    attachMenu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeAttachMenu();
        attachBtn.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- 动作反馈 ---------- */
  document.querySelectorAll('[data-action]').forEach(function (b) {
    b.addEventListener('click', function () {
      /* 第 31 轮：「新建任务」在任何页面都回到最初的落地首页
         （不带参数；顺手把左侧任务列表收起来，回到首屏那张 hero 卡） */
      if (b.dataset.action === '新建任务') {
        try {
          var ws = JSON.parse(localStorage.getItem('cecoder.wsDrawer') || '{}') || {};
          ws.open = false;
          localStorage.setItem('cecoder.wsDrawer', JSON.stringify(ws));
        } catch (err) {}
        location.href = 'cecoder-home.html';
        return;
      }
      /* 第 32 轮：「新建会话」→ 右侧切回首页形态（hero + 输入区），左侧任务列表保持
         展开并停在「会话」页签，方便直接挑一个旧会话或新建 */
      if (b.dataset.action === '新建会话') {
        try {
          var ws2 = JSON.parse(localStorage.getItem('cecoder.wsDrawer') || '{}') || {};
          ws2.open = true;
          localStorage.setItem('cecoder.wsDrawer', JSON.stringify(ws2));
        } catch (err2) {}
        location.href = 'cecoder-home.html?tab=' + encodeURIComponent('会话') + '&new=1';
        return;
      }
      toast(b.dataset.action);
    });
  });

  /* ---------- 工作任务列表侧栏（左侧滑出） ---------- */
  var drawer = document.getElementById('wsDrawer');
  var menuBtn = document.querySelector('.menu-btn');
  var wdScroll = document.getElementById('wdScroll');
  var wdThumb = document.getElementById('wdThumb');

  /* ---------- 第 30 轮：卡片点击 = 跳转到独立页面 ---------- */
  function sessCards() { return [].slice.call(drawer.querySelectorAll('#wdViewSession .wd-sess-card')); }
  function taskCards() { return [].slice.call(drawer.querySelectorAll('#wdViewTask .wd-card')); }
  function markSel(list, target) {
    list.forEach(function (c) {
      var on = c === target;
      c.classList.toggle('is-sel', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function clampId(id, len) { return Math.max(0, Math.min(len - 1, isNaN(id) ? 0 : id)); }

  function openSession(id) {
    var list = sessCards(); if (!list.length) return;
    var i = clampId(id, list.length);
    markSel(list, list[i]);
    if (PAGE === 'session') { applySession(i); replaceUrl('cecoder-session', { tab: '会话', id: i }); }
    else { location.href = pageUrl('cecoder-session', { tab: '会话', id: i }); }
  }
  function openTask(id) {
    var list = taskCards(); if (!list.length) return;
    var i = clampId(id, list.length);
    markSel(list, list[i]);
    if (PAGE === 'task') { applyTask(i); replaceUrl('cecoder-task', { tab: '任务', id: i }); }
    else { location.href = pageUrl('cecoder-task', { tab: '任务', id: i }); }
  }
  function selectFirstSession() {
    var list = sessCards(); if (!list.length) return;
    var vis = list.filter(function (c) { return c.getBoundingClientRect().height > 0; });
    if (!vis.length) {
      var head = drawer.querySelector('#wdViewSession .wd-grp-head');
      if (head && head.getAttribute('aria-expanded') === 'false') head.click();
      vis = list.slice(0, 1);
    }
    markSel(list, vis[0]);
  }

  /* 进入「会话」页签：只落选中，不跳页（点卡片才进会话页） */
  var SUPPRESS_TAB_SEL = false;   /* boot 里按 url 指定会话时，跳过「默认选第一条」 */
  document.querySelectorAll('[data-wd-tab="会话"]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (SUPPRESS_TAB_SEL) return;
      setTimeout(selectFirstSession, 0);
    });
  });

  drawer.querySelectorAll('.wd-sess-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.wd-more') || e.target.closest('.wd-menu')) return;
      openSession(sessCards().indexOf(card));
    });
    card.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openSession(sessCards().indexOf(card));
    });
  });

  /* 会话页按 Esc → 先收起右栏；没有右栏再回首页列表（首页/任务页不接管 Esc） */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || PAGE !== 'session') return;
    if (document.querySelector('.cds-dd.is-open, #wdCardMenu:not([hidden]), #wdSessMenu:not([hidden]), #wdGrpMenu:not([hidden]), #attachMenu:not([hidden]), #fabMenu:not([hidden])')) return;
    if (rsCloseNow(true)) return;
    var i = parseInt(QS.get('id') || '0', 10);
    location.href = pageUrl('cecoder-home', { tab: '会话', sel: isNaN(i) ? 0 : i });
  });

  /* ---------- 卡片 / 分组「更多操作」下拉：任务卡、会话卡、分组头各一套菜单 ---------- */
  var cardMenu = document.getElementById('wdCardMenu');
  var sessMenu = document.getElementById('wdSessMenu');
  var grpMenu = document.getElementById('wdGrpMenu');
  var cardMenuBtn = null;
  var cardMenuEl = cardMenu;
  var cardMenuHost = null;   /* 菜单对应的宿主：卡片 或 .wd-grp */

  function closeCardMenu() {
    if (!cardMenuBtn) return;
    [cardMenu, sessMenu, grpMenu].forEach(function (m) { if (m) m.hidden = true; });
    cardMenuBtn.classList.remove('is-open');
    cardMenuBtn.setAttribute('aria-expanded', 'false');
    cardMenuBtn = null;
    cardMenuHost = null;
  }

  function openCardMenu(btn) {
    var host = btn.closest('.wd-card, .wd-sess-card, .wd-grp');
    if (!host) return;
    closeCardMenu();
    cardMenuBtn = btn;
    cardMenuHost = host;
    cardMenuEl = host.classList.contains('wd-grp') ? grpMenu
      : host.classList.contains('wd-sess-card') ? sessMenu : cardMenu;
    var titleEl = host.querySelector('.wd-card-title, .wd-sess-title, .wd-grp-name');
    cardMenuEl.dataset.title = titleEl ? titleEl.textContent.trim() : '';
    cardMenuEl.hidden = false;
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    /* fixed 定位：按按钮右缘对齐，向上/向下都留在视口内 */
    var r = btn.getBoundingClientRect();
    var w = cardMenuEl.offsetWidth, h = cardMenuEl.offsetHeight;
    var left = Math.max(8, Math.min(Math.round(r.right - w), window.innerWidth - w - 8));
    var top = Math.round(r.bottom + 4);
    if (top + h > window.innerHeight - 8) top = Math.max(8, Math.round(r.top - h - 4));
    cardMenuEl.style.left = left + 'px';
    cardMenuEl.style.top = top + 'px';
    var first = cardMenuEl.querySelector('.wd-menu-item');
    if (first) first.focus({ preventScroll: true });
  }

  function bindMore(b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (b.classList.contains('is-open')) { closeCardMenu(); return; }
      openCardMenu(b);
    });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      e.stopPropagation();
      openCardMenu(b);
    });
  }
  drawer.querySelectorAll('.wd-more').forEach(bindMore);

  /* 第 14 轮：hover「更多」展开会从标题那里抢 24px，标题若在 1/2 行临界就会
     重排，卡片高度 80↔100 闪一下。直接在初始布局把标题高度定死（只改高度、不改
     宽度，标签照常被向左挤），这样任何宽度下 hover 都不可能再改卡片高度。
     抽屉宽度变化后重算一次，避免从 480 拖到 300 时留下过期的单行高度。 */
  /* 第 21 轮：折叠分组里的卡片 offsetHeight = 0，原来会被锁成 0px —— 展开后标题看不见。
     现在只锁「量得到高度」的标题，并在任何分组展开/收起后重新量一次 */
  function wdLockTitles() {
    var titles = drawer.querySelectorAll('.wd-card-title');
    titles.forEach(function (t) { t.style.height = ''; });
    titles.forEach(function (t) {
      var h = t.offsetHeight;
      if (h > 0) t.style.height = h + 'px';
    });
  }
  wdLockTitles();
  window.addEventListener('resize', wdLockTitles);
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('.wd-grp-head')) setTimeout(wdLockTitles, 0);
  });

  /* 第 32 轮：分组菜单里的两项真动作（其余三项给 toast 反馈） */
  function grpAction(act, host) {
    if (!host || !host.classList.contains('wd-grp')) return;
    if (act === '置顶') {
      var wrap = host.parentElement;
      if (wrap && wrap.firstElementChild !== host) {
        wrap.insertBefore(host, wrap.firstElementChild);
        host.scrollIntoView({ block: 'nearest' });
        syncThumb();
        wdLockTitles();
      }
    } else if (act === '移除分组') {
      host.classList.add('is-removing');
      setTimeout(function () {
        if (host.parentElement) host.parentElement.removeChild(host);
        syncThumb();
        wdLockTitles();
      }, 200);
    }
  }

  function bindMenu(menu, actKey, hook) {
    if (!menu) return;
    menu.querySelectorAll('.wd-menu-item').forEach(function (it) {
      it.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = menu.dataset.title || '';
        var act = it.dataset[actKey] || it.textContent;
        if (hook) hook(act, cardMenuHost);
        toast(act + (t ? '：' + t : ''));
        closeCardMenu();
      });
    });
    /* 菜单内键盘：↑↓ 循环、Esc 关闭 */
    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('.wd-menu-item'));
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { e.stopPropagation(); var own = cardMenuBtn; closeCardMenu(); if (own) own.focus(); }
      else if (e.key === 'Tab') { closeCardMenu(); }
    });
  }
  bindMenu(cardMenu, 'cardAct');
  bindMenu(sessMenu, 'sessAct');
  bindMenu(grpMenu, 'grpAct', grpAction);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !cardMenuBtn || cardMenuEl.hidden) return;
    e.stopPropagation();
    var b = cardMenuBtn;
    closeCardMenu();
    if (b) b.focus({ preventScroll: true });
  }, true);
  if (wdScroll) wdScroll.addEventListener('scroll', closeCardMenu, { passive: true });
  window.addEventListener('resize', closeCardMenu);

  function syncThumb() {
    if (!wdScroll || !wdThumb) return;
    var ch = wdScroll.clientHeight, sh = wdScroll.scrollHeight;
    if (!ch || sh <= ch + 1) { wdThumb.classList.remove('is-on'); return; }
    var h = Math.max(40, Math.round(ch * ch / sh));
    var max = ch - h;
    var top = (sh - ch) ? (wdScroll.scrollTop / (sh - ch)) * max : 0;
    wdThumb.classList.add('is-on');
    wdThumb.style.height = h + 'px';
    wdThumb.style.transform = 'translateY(' + Math.round(top) + 'px)';
  }

  /* ---------- 侧栏状态记忆（展开/收起 + 宽度） ---------- */
  var WS_KEY = 'cecoder.wsDrawer';
  var WS_MIN = 300, WS_MAX = 720, WS_DEF = 320;
  /* 第 41 轮：左栏上限不再死守 480（原来拖到 480 就停，1440 下左右栏同开时中间面板被卡死）。
     第 43 轮修正：用户要的是「中间面板拖窄到 400 就到底」，所以把下限口径改成 400，
     并且左栏、右栏、窗口缩放三条路径共用同一个 pmMinW() —— 之前只给左栏设了 320，
     右栏一拉宽照样能把中间面板压到 400 以下。 */
  var PM_MIN_CHAT = 400, PM_MIN_PLAIN = 320;
  function pmMinW() {
    var pm = document.querySelector('.panel-main');
    return (pm && pm.classList.contains('is-chat')) ? PM_MIN_CHAT : PM_MIN_PLAIN;
  }
  function wsMax() {
    var hostEl = drawer.parentElement;
    var panelW = hostEl ? hostEl.clientWidth : window.innerWidth;
    var rd = document.getElementById('rsDrawer');
    var rsW = (rd && rd.classList.contains('is-open')) ? rd.getBoundingClientRect().width : 0;
    return Math.max(WS_MIN + 80, Math.min(WS_MAX, Math.round(panelW - rsW - pmMinW())));
  }
  var resizer = document.getElementById('wsResizer');
  function wsStore() {
    try { return JSON.parse(localStorage.getItem(WS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function wsSave(patch) {
    var s = wsStore();
    for (var k in patch) s[k] = patch[k];
    try { localStorage.setItem(WS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function wsWidth() {
    var v = parseInt(getComputedStyle(drawer).getPropertyValue('--ws-w'), 10);
    return isNaN(v) ? WS_DEF : v;
  }
  function wsSetWidth(w) {
    w = Math.max(WS_MIN, Math.min(wsMax(), Math.round(w)));
    drawer.style.setProperty('--ws-w', w + 'px');
    resizer.setAttribute('aria-valuenow', String(w));
    return w;
  }
  /* 解析阶段已还原：把菜单键状态补齐，并撤掉「无动画」 */
  if (drawer.dataset.restored) {
    menuBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { drawer.classList.remove('no-anim'); });
    });
  }
  if (wsStore().w) wsSetWidth(wsStore().w);

  /* ---------- 右边缘拖拽改宽（300 ~ 480） ---------- */
  var rs = null;
  resizer.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !drawer.classList.contains('is-open')) return;
    rs = { x: e.clientX, w: wsWidth() };
    drawer.classList.add('is-resizing');
    resizer.classList.add('is-active');
    try { resizer.setPointerCapture(e.pointerId); } catch (err) {}
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });
  resizer.addEventListener('pointermove', function (e) {
    if (!rs) return;
    wsSetWidth(rs.w + (e.clientX - rs.x));
  });
  function endResize(e) {
    if (!rs) return;
    rs = null;
    drawer.classList.remove('is-resizing');
    resizer.classList.remove('is-active');
    document.body.style.cursor = '';
    wsSave({ w: wsWidth() });
    syncThumb();
    if (e && e.pointerId != null) { try { resizer.releasePointerCapture(e.pointerId); } catch (err) {} }
  }
  resizer.addEventListener('pointerup', endResize);
  resizer.addEventListener('pointercancel', endResize);
  /* 键盘微调：← → 每次 16，Home/End 到两端 */
  resizer.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    var w = wsWidth(), step = e.shiftKey ? 32 : 16, nw = null;
    if (e.key === 'ArrowLeft') nw = w - step;
    else if (e.key === 'ArrowRight') nw = w + step;
    else if (e.key === 'Home') nw = WS_MIN;
    else if (e.key === 'End') nw = wsMax();
    if (nw == null) return;
    e.preventDefault();
    wsSetWidth(nw);
    wsSave({ w: wsWidth() });
    syncThumb();
  });

  /* ============================================================
     第 42 轮：折叠态「待确认」浮标（整块替掉第 13 轮的涟漪圆点）
     · 出现条件：左栏已收起 + 列表里还有待确认卡片；浮出前随机等 0.45~1.35s，
       避免每次收栏都「啪」地同一瞬间弹出来
     · 去处理：展开左栏 → 切到含待确认的页签 → 展开所属分组 → 滚到卡片并给 1.5s 橙色圈
     · 稍后：先收起，20s 后仍在折叠态就再浮一次
     ============================================================ */
  var fpTip = document.getElementById('fpTip');
  var fpNumEl = document.getElementById('fpNum');
  var fpGoBtn = document.getElementById('fpGo');
  var fpLaterBtn = document.getElementById('fpLater');
  var fpShowT = 0, fpSnoozeT = 0;

  function fpPending() {
    /* 以「待确认」chip 为准（任务卡 + 会话卡），拿不到再退回 is-todo 类 */
    var n = drawer.querySelectorAll('.wd-card .wd-chip-todo, .wd-sess-card .wd-chip-todo').length;
    if (!n) n = drawer.querySelectorAll('.wd-card.is-todo, .wd-sess-card.is-todo').length;
    return n;
  }
  /* 会话形态（.panel-main.is-chat）里左上角被「对话 / 轨迹」页签占着，
     浮标压上去会挡点击，所以这种形态下不浮出；只落在工作台画布上 */
  function fpAllowed() {
    var pm = document.getElementById('panelMain');
    return !(pm && pm.classList.contains('is-chat'));
  }
  function fpHide() {
    if (fpShowT) { clearTimeout(fpShowT); fpShowT = 0; }
    if (!fpTip) return;
    fpTip.classList.remove('is-on');
    fpTip.setAttribute('aria-hidden', 'true');
  }
  function fpPop() {
    if (!fpTip || !fpAllowed()) return;
    var n = fpPending();
    if (!n || drawer.classList.contains('is-open')) return;
    fpNumEl.textContent = String(n);
    fpTip.classList.add('is-on');
    fpTip.setAttribute('aria-hidden', 'false');
  }
  function syncFpTip() {
    var n = fpPending();
    if (!n || !fpAllowed() || drawer.classList.contains('is-open')) { fpHide(); return; }
    if (fpShowT || (fpTip && fpTip.classList.contains('is-on'))) return;
    fpShowT = setTimeout(function () { fpShowT = 0; fpPop(); }, 450 + Math.random() * 900);
  }

  /* 找当前第一张待确认卡（优先任务页签，其次会话页签） */
  function fpTarget() {
    var pick = function (root) {
      if (!root) return null;
      var cards = root.querySelectorAll('.wd-card, .wd-sess-card');
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].querySelector('.wd-chip-todo') || cards[i].classList.contains('is-todo')) return cards[i];
      }
      return null;
    };
    var viewTask = document.getElementById('wdViewTask');
    var viewSess = document.getElementById('wdViewSession');
    var t = pick(viewTask);
    if (t) return { el: t, view: '任务' };
    t = pick(viewSess);
    return t ? { el: t, view: '会话' } : null;
  }

  function fpGoTo() {
    var hit = fpTarget();
    if (!hit) return;
    var tab = drawer.querySelector('[data-wd-tab="' + hit.view + '"]');
    if (tab && !tab.classList.contains('is-active')) tab.click();
    /* 卡片在折叠分组里时先摊开，否则滚过去是一片标题 */
    var grp = hit.el.closest ? hit.el.closest('.wd-grp') : null;
    if (grp && !grp.classList.contains('is-open')) {
      var head = grp.querySelector('.wd-grp-head');
      if (head) head.click();
    }
    /* 等抽屉 260ms 宽度动画 + 分组摊开再定位，否则量到的是中间态 */
    setTimeout(function () {
      try { hit.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { hit.el.scrollIntoView(); }
      hit.el.classList.add('is-fp-focus');
      setTimeout(function () { hit.el.classList.remove('is-fp-focus'); }, 1500);
      try { hit.el.focus({ preventScroll: true }); } catch (err) {}
    }, 380);
  }

  if (fpGoBtn) fpGoBtn.addEventListener('click', function () {
    fpHide();
    clearTimeout(fpSnoozeT);
    if (!drawer.classList.contains('is-open')) openDrawer();
    fpGoTo();
  });
  if (fpLaterBtn) fpLaterBtn.addEventListener('click', function () {
    fpHide();
    clearTimeout(fpSnoozeT);
    fpSnoozeT = setTimeout(function () {
      if (!drawer.classList.contains('is-open')) syncFpTip();
    }, 20000);
  });

  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    wsSave({ open: true });
    syncFpTip();
    syncThumb();
    /* 侧栏滑出后进度条再长出来（等 120ms，避免和宽度动画抢视觉） */
    setTimeout(growBars, 120);
    setTimeout(function () { clampPanels(); syncStageScroll(); rsFollow(); }, 320);
    setTimeout(function () { drawer.focus({ preventScroll: true }); }, 40);
  }

  function closeDrawer(back) {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    /* 收起时复位进度条动画，下次展开重放 */
    drawer.querySelectorAll('.wd-bar.is-anim').forEach(function (b) { b.classList.remove('is-anim'); });
    /* 排序浮层别跟着留到下一次展开（收起键 stopPropagation，靠 document 兜不住） */
    wdSortClose();
    wdSearchExit(true);
    closeCardMenu();
    wsSave({ open: false });
    syncFpTip();
    setTimeout(function () { clampPanels(); syncStageScroll(); rsFollow(); }, 320);
    if (back) menuBtn.focus({ preventScroll: true });
  }
  syncFpTip();

  menuBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (drawer.classList.contains('is-open')) closeDrawer(true); else openDrawer();
  });
  drawer.querySelectorAll('[data-drawer-close]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); closeDrawer(true); });
  });
  /* 卡片里的「更多」不再冒泡触发整卡动作 */
  drawer.querySelectorAll('.wd-more').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  /* ---------- 任务卡选中（单选，底 #3770F7 @11%） ---------- */
  var wdCards = [].slice.call(drawer.querySelectorAll('.wd-card'));
  function wdSelect(card) {
    var on = card.classList.contains('is-sel');
    wdCards.forEach(function (c) { c.classList.remove('is-sel'); c.setAttribute('aria-pressed', 'false'); });
    if (!on) { card.classList.add('is-sel'); card.setAttribute('aria-pressed', 'true'); }
  }
  wdCards.forEach(function (card) {
    card.setAttribute('aria-pressed', 'false');
    /* 第 30 轮：点任务卡 → 独立的「任务详情」页 */
    card.addEventListener('click', function () { openTask(taskCards().indexOf(card)); });
    card.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      openTask(taskCards().indexOf(card));
    });
  });

  /* ============================================================
     第 31 轮：会话页右栏（上下文）
     与左栏同一套：面板内 flex 挤压 + 左缘 5px 把手拖宽（280~480，默认 320）
     + localStorage 记忆（展开态 / 宽度）+ Esc 先收右栏
     ============================================================ */
  var rsDrawer = document.getElementById('rsDrawer');
  var rsResizer = document.getElementById('rsResizer');
  var rsToggle = document.getElementById('rsToggle');
  var RS_KEY = 'cecoder.rsDrawer';
  /* 第 32 轮：默认宽度改成「panel-main 的一半」（内容区宽 = panel 宽 - 已展开的左栏）；
     第 34 轮：上限放宽到 960 —— 1920 宽的屏上一半是 790，720 会把它截断；并且
     只有「用户真拖过」（manual）才记住手改宽度，历史遗留的 w 一律当默认值忽略 */
  var RS_MIN = 280, RS_MAX = 960, RS_DEF = 320;

  function rsStore() {
    try { return JSON.parse(localStorage.getItem(RS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function rsSave(patch) {
    var s = rsStore();
    for (var k in patch) s[k] = patch[k];
    try { localStorage.setItem(RS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  /* 右栏收起时 panel-main 的宽度（= panel 内容宽 - 左栏） */
  function rsBaseW() {
    var panel = rsDrawer && rsDrawer.parentElement;
    var w = panel ? panel.clientWidth : 0;
    var ws = document.getElementById('wsDrawer');
    if (ws && ws.classList.contains('is-open')) w -= ws.offsetWidth;
    return Math.max(0, w);
  }
  function rsDefaultW() { return Math.max(RS_MIN, Math.min(RS_MAX, Math.round(rsBaseW() / 2))); }
  /* 第 43 轮：右栏也有上限 —— 拉宽右栏一样会把中间面板压窄，
     所以上限同样按「总宽 - 左栏 - 中间面板下限」算（is-chat 时下限 400）。 */
  function rsMaxW() {
    var panel = rsDrawer && rsDrawer.parentElement;
    var total = panel ? panel.clientWidth : window.innerWidth;
    var ws = document.getElementById('wsDrawer');
    var wsW = (ws && ws.classList.contains('is-open')) ? ws.offsetWidth : 0;
    return Math.max(RS_MIN, Math.min(RS_MAX, Math.round(total - wsW - pmMinW())));
  }
  /* 左栏展开/收起会改 panel-main 宽度 —— 没手动拖过就重新按「一半」算 */
  function rsManualW() { var s = rsStore(); return s.manual ? s.w : 0; }
  function rsFollow() { if (rsDrawer && !rsManualW()) rsSetWidth(rsDefaultW()); }
  function rsWidth() {
    if (!rsDrawer) return RS_DEF;
    var v = parseInt(getComputedStyle(rsDrawer).getPropertyValue('--rs-w'), 10);
    return isNaN(v) ? RS_DEF : v;
  }
  function rsSetWidth(w) {
    if (!rsDrawer) return w;
    w = Math.max(RS_MIN, Math.min(rsMaxW(), Math.round(w)));
    rsDrawer.style.setProperty('--rs-w', w + 'px');
    if (rsResizer) rsResizer.setAttribute('aria-valuenow', String(w));
    return w;
  }
  /* 中间面板下限的统一兜底：窗口缩放、进出会话态、左右栏开合之后各再收一次。
     顺序必须是「先收左栏，再收右栏」—— 否则右栏上限会按还没收窄的左栏去算，
     白丢一截宽度。 */
  function clampPanels() {
    if (drawer.classList.contains('is-open')) wsSetWidth(wsWidth());
    if (rsDrawer) rsSetWidth(rsWidth());
  }
  function rsSyncBtn() {
    if (!rsToggle || !rsDrawer) return;
    var on = rsDrawer.classList.contains('is-open');
    rsToggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    rsToggle.setAttribute('aria-label', on ? '收起右栏' : '展开右栏');
    rsToggle.setAttribute('data-tip', on ? '收起右栏' : '展开右栏');
  }
  function rsOpen() {
    if (!rsDrawer || rsDrawer.classList.contains('is-open')) return;
    if (!rsManualW()) rsSetWidth(rsDefaultW());
    rsDrawer.classList.add('is-open');
    rsDrawer.setAttribute('aria-hidden', 'false');
    rsSave({ open: true });
    rsSyncBtn();
  }
  /* 收右栏；收掉了返回 true（Esc 用它决定要不要继续回首页） */
  function rsCloseNow(back) {
    if (!rsDrawer || !rsDrawer.classList.contains('is-open')) return false;
    rsDrawer.classList.remove('is-open');
    rsDrawer.setAttribute('aria-hidden', 'true');
    rsSave({ open: false });
    rsSyncBtn();
    if (back && rsToggle) rsToggle.focus({ preventScroll: true });
    return true;
  }

  if (rsDrawer) {
    /* 解析阶段就已还原过（rightpanel.html 里的内联脚本），这里只补齐按钮态 */
    if (rsDrawer.dataset.restored) {
      rsSyncBtn();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { rsDrawer.classList.remove('no-anim'); });
      });
    }
    if (rsManualW()) rsSetWidth(rsManualW()); else rsSetWidth(rsDefaultW());

    /* 窗口 / 左栏变化时，未被手动拖过的右栏继续跟着「一半」走 */
    window.addEventListener('resize', function () {
      /* 第 43 轮：窄窗时先收左栏再收右栏，保证中间面板不破 400 */
      clampPanels();
      if (!rsManualW()) rsSetWidth(rsDefaultW());
    });

    rsToggle.addEventListener('click', function () {
      if (rsDrawer.classList.contains('is-open')) rsCloseNow(true); else rsOpen();
    });
    document.querySelectorAll('[data-rs-close]').forEach(function (b) {
      b.addEventListener('click', function () { rsCloseNow(true); });
    });

    /* 左缘拖拽改宽：向左拖变宽 */
    var rsr = null;
    rsResizer.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !rsDrawer.classList.contains('is-open')) return;
      rsr = { x: e.clientX, w: rsWidth() };
      rsDrawer.classList.add('is-resizing');
      rsResizer.classList.add('is-active');
      try { rsResizer.setPointerCapture(e.pointerId); } catch (err) {}
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });
    rsResizer.addEventListener('pointermove', function (e) {
      if (!rsr) return;
      rsSetWidth(rsr.w - (e.clientX - rsr.x));
    });
    function rsEndResize(e) {
      if (!rsr) return;
      rsr = null;
      rsDrawer.classList.remove('is-resizing');
      rsResizer.classList.remove('is-active');
      document.body.style.cursor = '';
      rsSave({ w: rsWidth(), manual: true });
      if (e && e.pointerId != null) { try { rsResizer.releasePointerCapture(e.pointerId); } catch (err) {} }
    }
    rsResizer.addEventListener('pointerup', rsEndResize);
    rsResizer.addEventListener('pointercancel', rsEndResize);
    rsResizer.addEventListener('keydown', function (e) {
      if (!rsDrawer.classList.contains('is-open')) return;
      var w = rsWidth(), step = e.shiftKey ? 32 : 16, nw = null;
      if (e.key === 'ArrowLeft') nw = w + step;
      else if (e.key === 'ArrowRight') nw = w - step;
      else if (e.key === 'Home') nw = RS_MAX;
      else if (e.key === 'End') nw = RS_MIN;
      if (nw == null) return;
      e.preventDefault();
      rsSetWidth(nw);
      rsSave({ w: rsWidth(), manual: true });
    });

    /* 变更 / 文件 页签 */
    document.querySelectorAll('.rs-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        if (t.classList.contains('is-active')) return;
        document.querySelectorAll('.rs-tab').forEach(function (x) {
          x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false');
        });
        t.classList.add('is-active');
        t.setAttribute('aria-selected', 'true');
        var k = t.dataset.rsTab;
        document.querySelectorAll('.rs-pane').forEach(function (p) { p.hidden = p.dataset.rsPane !== k; });
      });
    });

    /* 改动行单选 */
    document.querySelectorAll('.rs-pane[data-rs-pane="change"] .rs-row').forEach(function (row) {
      row.addEventListener('click', function () {
        document.querySelectorAll('.rs-pane[data-rs-pane="change"] .rs-row').forEach(function (x) {
          x.classList.remove('is-sel');
        });
        row.classList.add('is-sel');
      });
    });
  }

  /* ---------- 进度条入场动效（每次展开侧栏都重放） ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function growBars() {
    if (reduced) return;
    var bars = [].slice.call(drawer.querySelectorAll('.wd-bar')).filter(function (b) { return b.children.length; });
    bars.forEach(function (b) { b.classList.remove('is-anim'); });
    void drawer.offsetWidth;
    bars.forEach(function (b) { b.classList.add('is-anim'); });
  }
  /* 记忆里是「展开」时，首屏也放一次 */
  if (drawer.classList.contains('is-open')) setTimeout(growBars, 160);

  /* 侧栏是 panel 内的停靠栏（挤压布局），不再「点外部收起」；用 Esc / 头部收起键 / 菜单键 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(true);
  });

  /* 工作目录文件夹：点击展开/折叠（原生 button + aria-expanded），箭头 → 转成 ↓ */
  /* 第 32 轮：分组头从 <button> 改成 div[role=button]（里面放了「更多」按钮），
     Chrome 对可聚焦的 role=button 会自己把 Enter/Space 合成 click —— 不能再自己
     绑 keydown，否则一次按键会折叠两次（打开又关掉） */
  function toggleGrp(h) {
    var grp = h.closest('.wd-grp');
    var open = grp.classList.toggle('is-open');
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* 折叠时补下边线（is-edge），和旁边那些折叠目录连成一体 */
    h.classList.toggle('is-edge', !open);
    syncThumb();
  }
  function bindGrpHead(h) {
    h.addEventListener('click', function (e) {
      if (e.target.closest('.wd-more')) return;
      toggleGrp(h);
    });
  }
  drawer.querySelectorAll('.wd-grp-head').forEach(bindGrpHead);

  /* ============================================================
     工具行：添加工作目录 / 搜索激活态 / 排序下拉（第 9 轮）
     ============================================================ */
  var wdTools = document.getElementById('wdTools');
  var wdScrollEl = document.getElementById('wdScroll');
  var wdGroups = drawer.querySelector('.wd-groups');
  /* 第 40 轮：两个页签共用同一个「添加工作目录」按钮，新分组要落到当前可见视图的
     分组容器里 —— 原先固定塞进第一个 .wd-groups，在会话页签下会加进被隐藏的任务视图 */
  function activeGroups() {
    var view = drawer.querySelector('.wd-view:not([hidden])');
    return (view && view.querySelector('.wd-groups')) || wdGroups;
  }

  /* ---------- 第 41 轮：分组文件夹配色 ----------
     预置 10 色（柔和版 Google 色板，S≈35~65 / L≈62~78），随机取一枚写进
     --wd-folder-color；取过的按「分组名」记进 localStorage，之后不再变
     （同名目录在会话 / 任务两个视图里也保持同色）。 */
  var FOLDER_COLORS = ['#87A9E3', '#7FC0DC', '#86C6B6', '#7FC59C', '#C6D08E', '#E5C68F', '#EAB79B', '#E39991', '#DFA2C0', '#B3A1DE'];
  var GRP_COLOR_KEY = 'cecoder.grpColor';
  function grpColorMap() {
    try { return JSON.parse(localStorage.getItem(GRP_COLOR_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveGrpColors(map) {
    try { localStorage.setItem(GRP_COLOR_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function pickColor(used) {
    var pool = FOLDER_COLORS.filter(function (c) { return used.indexOf(c) < 0; });
    if (!pool.length) pool = FOLDER_COLORS;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function paintGroupColors() {
    var map = grpColorMap(), dirty = false;
    drawer.querySelectorAll('.wd-view').forEach(function (view) {
      /* 两趟：先把该视图里已经记过色的（含同名目录）收进 used，再给新名字挑色，
         否则「工作台会话」可能挑到还没轮到的 Nutstore 已有的琥珀色，撞色 */
      var used = [];
      var list = Array.prototype.slice.call(view.querySelectorAll('.wd-grp'));
      list.forEach(function (g) {
        var nm = g.querySelector('.wd-grp-name');
        if (!nm) return;
        var k = nm.textContent.trim();
        if (map[k]) used.push(map[k]);
      });
      list.forEach(function (g) {
        var nm = g.querySelector('.wd-grp-name');
        if (!nm) return;
        var key = nm.textContent.trim();
        if (!map[key]) { map[key] = pickColor(used); used.push(map[key]); dirty = true; }
        g.style.setProperty('--wd-folder-color', map[key]);
      });
    });
    if (dirty) saveGrpColors(map);
  }
  paintGroupColors();

  /* ---------- 添加工作目录：调起系统文件夹选择器 ---------- */
  var addDirBtn = document.getElementById('wdAddDir');
  var dirPick = document.getElementById('wdDirPick');

  function addDirGroup(name) {
    var grp = document.createElement('div');
    grp.className = 'wd-grp is-open';
    /* 第 41 轮：色板随机取色（同名目录沿用已记下的颜色） */
    var host = activeGroups();
    var cmap = grpColorMap();
    var ckey = String(name).trim();
    if (!cmap[ckey]) {
      var usedNow = [].map.call(host.querySelectorAll(':scope > .wd-grp'), function (g) {
        return g.style.getPropertyValue('--wd-folder-color');
      });
      cmap[ckey] = pickColor(usedNow);
      saveGrpColors(cmap);
    }
    grp.style.setProperty('--wd-folder-color', cmap[ckey]);

    var head = document.createElement('div');
    head.className = 'wd-grp-head is-open';
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.setAttribute('aria-expanded', 'true');
    var nm = document.createElement('span');
    nm.className = 'wd-grp-name';
    nm.textContent = name;
    /* 第 25 轮：箭头在前、名称在后（与静态分组头一致） */
    head.appendChild(drawer.querySelector('.wd-caret').cloneNode(true));
    head.appendChild(nm);
    var num = document.createElement('span');
    num.className = 'wd-num n4';
    num.textContent = '0';
    /* 第 32 轮：计数 + 「更多」一起右对齐（与静态分组头同一结构），新加的分组也有「更多」 */
    var act = document.createElement('span');
    act.className = 'wd-grp-act';
    act.appendChild(num);
    var moreSrc = drawer.querySelector('.wd-grp-more');
    if (moreSrc) {
      var more = moreSrc.cloneNode(true);
      act.appendChild(more);
      bindMore(more);
    }
    head.appendChild(act);

    var sub = document.createElement('div');
    sub.className = 'wd-sub is-empty';
    var empty = drawer.querySelector('.wd-empty').cloneNode(true);
    empty.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.hasAttribute('data-sync-open')) {
          var s = document.getElementById('syncModal');
          if (s) { s.classList.add('is-open'); s.setAttribute('aria-hidden', 'false'); }
        } else { location.href = 'cecoder-home.html'; }
      });
    });
    sub.appendChild(empty);

    grp.appendChild(head);
    grp.appendChild(sub);
    host.appendChild(grp);
    bindGrpHead(head);
    syncThumb();
    grp.scrollIntoView({ block: 'nearest' });
    toast('已添加工作目录：' + name);
  }

  addDirBtn.addEventListener('click', async function () {
    /* 首选系统文件夹选择器（返回目录句柄，能拿到真实目录名） */
    if (window.showDirectoryPicker) {
      try {
        var handle = await window.showDirectoryPicker({ id: 'cecoder-workdir', mode: 'read' });
        if (handle && handle.name) { addDirGroup(handle.name); return; }
      } catch (err) {
        if (err && err.name === 'AbortError') return;            // 用户自己取消
        /* SecurityError 等（file:// 受限）→ 退回 input[webkitdirectory] */
      }
    }
    dirPick.click();
  });

  dirPick.addEventListener('change', function () {
    var f = dirPick.files && dirPick.files[0];
    if (!f) return;
    var rel = f.webkitRelativePath || '';
    addDirGroup(rel.split('/')[0] || '新建目录');
    dirPick.value = '';
  });

  /* ---------- 搜索：点图标整行变搜索框（稿 2983:52581） ---------- */
  var wdSearchBtn = document.getElementById('wdSearchBtn');
  var wdSearchInput = document.getElementById('wdSearchInput');
  var wdSearchClear = document.getElementById('wdSearchClear');

  function wdFilter(qOverride) {
    /* 第 39 轮：两个页签共用同一套工具行 + 同一个展开式搜索框，query 直接取输入值 */
    var q = (qOverride !== undefined ? qOverride : wdSearchInput.value).trim().toLowerCase();
    drawer.querySelectorAll('.wd-card, .wd-sess-card').forEach(function (c) {
      var hit = !q || (c.textContent || '').toLowerCase().indexOf(q) > -1;
      c.style.display = hit ? '' : 'none';
    });
    drawer.querySelectorAll('.wd-grp').forEach(function (g) {
      if (!q) { g.style.display = ''; return; }
      /* 搜索时连「目录本身」一起收：没有命中的目录连空态都不留 */
      var any = [].some.call(g.querySelectorAll('.wd-card, .wd-sess-card'), function (c) { return c.style.display !== 'none'; });
      g.style.display = any ? '' : 'none';
    });
    syncThumb();
  }

  var wdSearchBox = document.getElementById('wdSearch');
  function wdSearchEnter() {
    wdTools.classList.add('is-searching');
    if (wdSearchBox) wdSearchBox.setAttribute('aria-hidden', 'false');
    wdSearchInput.value = '';
    wdFilter();
    /* 等一帧再聚焦：搜索框从 width:32 开始展开，同帧 focus 会让 caret 位置先算错 */
    requestAnimationFrame(function () { wdSearchInput.focus(); });
  }
  function wdSearchExit(quiet) {
    wdTools.classList.remove('is-searching');
    if (wdSearchBox) wdSearchBox.setAttribute('aria-hidden', 'true');
    wdSearchInput.value = '';
    wdFilter();
    if (!quiet) wdSearchBtn.focus();
  }
  wdSearchBtn.addEventListener('click', wdSearchEnter);
  wdSearchClear.addEventListener('click', wdSearchExit);
  wdSearchInput.addEventListener('input', function () { wdFilter(); });
  wdSearchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); wdSearchExit(); }
  });

  /* ---------- 排序：下拉选「创建时间 / 更新顺序」 ---------- */
  var wdSortBtn = document.getElementById('wdSortBtn');
  var wdSortMenu = document.getElementById('wdSortMenu');
  var wdSortMode = 'created';
  var wdSortItems = [].slice.call(wdSortMenu.querySelectorAll('.wd-menu-item'));

  function wdSortClose() {
    wdSortMenu.hidden = true;
    wdSortBtn.setAttribute('aria-expanded', 'false');
  }
  function wdSortApply() {
    drawer.querySelectorAll('.wd-sub').forEach(function (sub) {
      var cards = [].slice.call(sub.children).filter(function (c) { return c.classList.contains('wd-card'); });
      if (cards.length < 2) return;
      cards.sort(function (a, b) {
        return (+b.dataset[wdSortMode] || 0) - (+a.dataset[wdSortMode] || 0);
      });
      var frag = document.createDocumentFragment();
      cards.forEach(function (c) { frag.appendChild(c); });
      var nt = sub.querySelector('.wd-newtask');
      if (nt) nt.after(frag); else sub.appendChild(frag);
    });
    syncThumb();
  }

  wdSortBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var willOpen = wdSortMenu.hidden;
    wdSortMenu.hidden = !willOpen;
    wdSortBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (wdSortMenu.hidden) return;
    if (wdSortMenu.contains(e.target) || wdSortBtn.contains(e.target)) return;
    wdSortClose();
  });
  wdSortItems.forEach(function (item) {
    item.addEventListener('click', function () {
      wdSortMode = item.dataset.sort;
      wdSortItems.forEach(function (x) {
        x.setAttribute('aria-checked', x === item ? 'true' : 'false');
      });
      wdSortApply();
      wdSortBtn.classList.toggle('is-on', wdSortMode === 'updated');
      wdSortClose();
      toast(wdSortMode === 'created' ? '已按创建时间排序' : '已按更新顺序排序');
    });
  });
  /* 侧栏收起时把浮层收掉 */
  document.addEventListener('click', function () {
    if (!drawer.classList.contains('is-open')) wdSortClose();
  });
  if (drawer.classList.contains('is-open')) wdSortApply();

  /* 任务 / 会话 切换：只切两个 .wd-view，滚动条与浮层沿用同一套实例 */
  var wdViewTask = document.getElementById('wdViewTask');
  var wdViewSession = document.getElementById('wdViewSession');
  var wdSearchInput = document.getElementById('wdSearchInput');
  drawer.querySelectorAll('.wd-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      /* 第 31 轮：记住最后停在「任务」还是「会话」，下次进页面直接还原 */
      try { localStorage.setItem('cecoder.wdTab', t.dataset.wdTab || ''); } catch (err) {}
      if (t.classList.contains('is-active')) return;
      drawer.querySelectorAll('.wd-tab').forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('is-active');
      t.setAttribute('aria-selected', 'true');
      var session = t.dataset.wdTab === '会话';
      if (wdViewTask) wdViewTask.hidden = session;
      if (wdViewSession) wdViewSession.hidden = !session;
      /* 第 39 轮：两个页签的工具行完全一致（添加工作目录 + 搜索 + 排序），
         只换搜索框的占位文案与无障碍标签，不再有 is-session 换装 */
      wdFilter('');
      if (wdSearchInput) wdSearchInput.placeholder = session ? '搜索会话关键词' : '搜索关键词';
      if (wdSearchBtn) {
        wdSearchBtn.setAttribute('aria-label', session ? '搜索会话' : '搜索任务');
        wdSearchBtn.setAttribute('data-tip', session ? '搜索会话' : '搜索任务');
      }
      if (typeof closeCardMenu === 'function') closeCardMenu();
      if (typeof wdSortClose === 'function') wdSortClose();
      if (typeof wdSearchExit === 'function' && wdTools && wdTools.classList.contains('is-searching')) wdSearchExit(true);
      wdScroll.scrollTop = 0;
      syncThumb();
      syncFpTip();
      growBars();
    });
  });

  /* 滚动条：静止滑块与拖拽 */
  if (wdScroll && wdThumb) {
    var tDrag = null;
    wdScroll.addEventListener('scroll', syncThumb, { passive: true });
    wdThumb.addEventListener('pointerdown', function (e) {
      tDrag = { y: e.clientY, top: wdScroll.scrollTop };
      wdThumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    wdThumb.addEventListener('pointermove', function (e) {
      if (!tDrag) return;
      var ch = wdScroll.clientHeight, sh = wdScroll.scrollHeight;
      var max = ch - wdThumb.offsetHeight;
      if (max <= 0) return;
      wdScroll.scrollTop = tDrag.top + (e.clientY - tDrag.y) * (sh - ch) / max;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      wdThumb.addEventListener(ev, function () { tDrag = null; });
    });
    window.addEventListener('resize', syncThumb);
  }

  /* role=button 的元素支持回车/空格 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (!t || t.tagName === 'BUTTON' || t.getAttribute('role') !== 'button') return;
    e.preventDefault();
    t.click();
  });

  /* ---------- 发送 ---------- */
  var ta = document.querySelector('.c-input');
  var composerEl = document.querySelector('.composer');
  var stageEl = document.querySelector('.stage');
  var CI_MIN = 46, CI_MAX = 256;   /* 两行高 → 最多 256（约 11 行），超出后输入框自己滚动 */

  function ciApply(h) {
    ta.style.height = h + 'px';
    composerEl.style.setProperty('--ci-h', h + 'px');
  }
  /* 输入变多 → 整块输入卡向上撑高（底边不动）：卡高 = 输入高 + 82，背板随卡。
     上限 256；但内容列（弹簧已被压到 min-height 24）装不下时按富余量回缩，
     保证底边永远不溢出面板块底边（小窗里本来就放不下时，交给 .stage 自己滚） */
  function ciGrow() {
    ta.style.height = 'auto';
    var want = Math.max(CI_MIN, Math.min(CI_MAX, ta.scrollHeight));
    ciApply(CI_MIN);                                   /* 先压到最小，量内容列还剩多少富余 */
    var spacer = stageEl && stageEl.querySelector('.stage-spacer');
    var spacerH = spacer ? spacer.offsetHeight : 0;
    var over = stageEl ? stageEl.scrollHeight - stageEl.clientHeight : 0;
    var maxFit = over > 1 ? CI_MAX : CI_MIN + Math.max(0, spacerH - 24);
    ciApply(Math.min(want, maxFit));
    ciReveal();
    syncStageScroll();
  }
  /* 小窗里内容列本身就要滚：撑高后把输入卡滚进视野，别让人对着看不到的输入框打字 */
  function ciReveal() {
    if (stageEl && stageEl.scrollHeight > stageEl.clientHeight + 1) {
      stageEl.scrollTop = stageEl.scrollHeight;
    }
  }
  ta.addEventListener('focus', ciReveal);
  ta.addEventListener('input', ciGrow);
  window.addEventListener('resize', ciGrow);
  ciGrow();

  function send() {
    var val = ta.value.trim();
    if (!val) { toast('请先描述你的目标'); return; }
    /* 第 30 轮：首页发送 → 带着这句话进会话页；会话页发送 → 直接落到当前对话 */
    if (PAGE === 'home') {
      var list = sessCards();
      var cur = list.filter(function (c) { return c.classList.contains('is-sel'); })[0];
      var idx = list.indexOf(cur); if (idx < 0) idx = 0;
      try { sessionStorage.setItem('cecoder.seed', val); } catch (err) {}
      location.href = pageUrl('cecoder-session', { tab: '会话', id: idx });
      return;
    }
    ta.value = '';
    ciGrow();
    if (PAGE === 'session') { appendMe(val); appendAi(); toast('已发送'); return; }
    toast('已发送');
  }
  document.querySelector('.c-send').addEventListener('click', send);
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  /* ---------- 第 20 轮：会话流进出 ---------- */
  var chatView = document.getElementById('chatView');
  var chatOn = !!document.getElementById('chatView');
  var CI_PH = '描述要解决的问题、目标或验收标准';
  var CHAT_PH = '继续追问，或补充上下文…';

  var panelMainEl = document.getElementById('panelMain');

  function enterChat() {
    if (chatOn || !stageEl || !chatView) return;
    chatOn = true;
    stageEl.classList.add('is-chat');
    if (panelMainEl) panelMainEl.classList.add('is-chat');
    ta.value = '';
    ciApply(CI_MIN);
    /* 进入会话态后中间面板下限从 320 → 400，两边栏超宽的立刻收回一点 */
    clampPanels();
    ta.placeholder = CHAT_PH;
    syncStageScroll();
    chatView.scrollTop = chatView.scrollHeight;
    requestAnimationFrame(function () { chatView.scrollTop = chatView.scrollHeight; });
    setTimeout(function () { chatView.scrollTop = chatView.scrollHeight; }, 80);
  }

  /* 对话 / 轨迹 页签 */
  document.querySelectorAll('.chat-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (!chatView) return;
      document.querySelectorAll('.chat-tab').forEach(function (x) {
        x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var k = tab.dataset.chatTab;
      document.querySelectorAll('.chat-pane').forEach(function (p) {
        p.hidden = p.dataset.chatPane !== k;
      });
      chatView.scrollTop = 0;
    });
  });

  function exitChat() {
    if (!chatOn) return;
    chatOn = false;
    stageEl.classList.remove('is-chat');
    if (panelMainEl) panelMainEl.classList.remove('is-chat');
    ta.placeholder = CI_PH;
    ciGrow();
    syncStageScroll();
  }

  /* ---------- 数字分身：自由拖动 ---------- */
  var fab = document.querySelector('.float');
  var drag = { on: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 };
  var EDGE = 8;

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  fab.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    /* 隐藏态摸不到；录音条可以随便拖（第 21 轮） */
    if (fab.classList.contains('is-hidden')) return;
    /* 第 24 轮：.float 的 offsetParent 是 .panel，style.left/top 也是相对它布局的，
       所以起点必须取 offsetLeft/offsetTop，不能拿 viewport 坐标减 frame 偏移（差 9px，拖一下会跳） */
    drag.on = true; drag.moved = false;
    drag.sx = e.clientX; drag.sy = e.clientY;
    drag.ox = fab.offsetLeft; drag.oy = fab.offsetTop;
    try { fab.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });

  fab.addEventListener('pointermove', function (e) {
    if (!drag.on) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 4) return;
      drag.moved = true;
      fab.classList.add('is-drag');
    }
    var box = fab.offsetParent || frame;
    var w = fab.offsetWidth, h = fab.offsetHeight;
    /* 取整：球停在半像素坐标上，整张 SVG 会被插值，看上去就是「糊」 */
    var x = Math.round(clamp(drag.ox + dx, EDGE, box.clientWidth - w - EDGE));
    var y = Math.round(clamp(drag.oy + dy, EDGE, box.clientHeight - h - EDGE));
    fab.style.left = x + 'px';
    fab.style.top = y + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  });

  function endDrag(e) {
    if (!drag.on) return;
    drag.on = false;
    fab.classList.remove('is-drag');
    if (drag.moved) {
      drag.moved = false;
      fab.dataset.dragged = '1';
      setTimeout(function () { delete fab.dataset.dragged; }, 0);
    }
    if (e && e.pointerId != null) { try { fab.releasePointerCapture(e.pointerId); } catch (err) {} }
  }
  fab.addEventListener('pointerup', endDrag);
  fab.addEventListener('pointercancel', endDrag);

  fab.addEventListener('click', function (e) {
    if (fab.dataset.dragged) { e.stopImmediatePropagation(); e.preventDefault(); return; }
  }, true);

  /* ---------- 第 19 轮：数字分身右键菜单（新建分身会话 / 录音 / 隐藏） ---------- */
  var fabMenu = document.getElementById('fabMenu');
  var recTimeEl = document.getElementById('recTime');
  var recTimer = null, recSecs = 0;

  function fmtSecs(n) {
    return (n < 600 ? '0' : '') + Math.floor(n / 60) + ':' + (n % 60 < 10 ? '0' : '') + (n % 60);
  }

  function closeFabMenu() {
    if (fabMenu && !fabMenu.hidden) fabMenu.hidden = true;
  }

  function openFabMenu() {
    if (!fabMenu) return;
    closeCardMenu(); closeAttachMenu();
    fabMenu.hidden = false;
    var r = fab.getBoundingClientRect();
    var w = fabMenu.offsetWidth, h = fabMenu.offsetHeight;
    var left = Math.max(8, Math.min(Math.round(r.right - w), window.innerWidth - w - 8));
    var top = Math.round(r.top - h - 6);
    if (top < 8) top = Math.round(r.bottom + 6);
    fabMenu.style.left = left + 'px';
    fabMenu.style.top = top + 'px';
    var first = fabMenu.querySelector('.wd-menu-item');
    if (first) first.focus({ preventScroll: true });
  }

  /* 变形时保持右缘不动（球靠右下角，长成工具条要向左长才不跑位）。
     注意：width 有过渡，class 刚加上时 offsetWidth 还是旧值，必须用目标宽度常量。 */
  var FAB_W = 56, REC_W = 212;

  /* 用 offset 几何（布局坐标）而不是 getBoundingClientRect：
     表情动画会给圆球带 scale，rect 的 right 会偏 1~2px，连着变几次就漂了 */
  function pinRightEdge(targetW, topOffset) {
    var w = targetW || fab.offsetWidth;
    var left = fab.offsetLeft, top = (topOffset == null ? fab.offsetTop : topOffset);
    var right = left + fab.offsetWidth;
    fab.style.left = Math.round(Math.max(EDGE, right - w)) + 'px';
    fab.style.right = 'auto';
    fab.style.top = Math.round(top) + 'px';
    fab.style.bottom = 'auto';
  }

  function startRec() {
    if (fab.classList.contains('is-recording')) return;
    var right = fab.offsetLeft + fab.offsetWidth, top = fab.offsetTop;
    fab.classList.remove('is-jump', 'is-nod', 'is-shake', 'is-happy', 'is-blink', 'is-breathe');
    fab.classList.add('is-recording');
    fab.setAttribute('aria-label', '录音中，点击停止');
    fab.style.top = Math.round(top) + 'px';
    fab.style.bottom = 'auto';
    fab.style.right = 'auto';
    fab.style.left = Math.round(Math.max(EDGE, right - REC_W)) + 'px';
    recSecs = 0;
    if (recTimeEl) recTimeEl.textContent = '00:00';
    clearInterval(recTimer);
    recTimer = setInterval(function () {
      recSecs++;
      if (recTimeEl) recTimeEl.textContent = fmtSecs(recSecs);
    }, 1000);
  }

  function stopRec() {
    if (!fab.classList.contains('is-recording')) return;
    var dur = fmtSecs(recSecs);
    clearInterval(recTimer); recTimer = null;
    var top = fab.offsetTop;
    fab.classList.remove('is-recording');
    fab.setAttribute('aria-label', '数字分身，可拖动');
    pinRightEdge(FAB_W, top);
    toast('录音已保存 · ' + dur);
  }

  function hideFab() {
    closeFabMenu();
    fab.classList.add('is-hidden');
    toast('数字分身已隐藏，按 H 键找回');
  }

  /* 录音中整条可点 = 停止（拦在捕获阶段，压掉「打开数字分身」的默认反馈） */
  fab.addEventListener('click', function (e) {
    if (!fab.classList.contains('is-recording')) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    stopRec();
  }, true);

  fab.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    /* 隐藏 / 录音中不弹菜单：录音条上右键没有意义，也避免出现「录音→录音」的死状态 */
    if (fab.classList.contains('is-hidden') || fab.classList.contains('is-recording')) return;
    openFabMenu();
  });
  fabMenu.addEventListener('click', function (e) { e.stopPropagation(); });
  fabMenu.querySelectorAll('.wd-menu-item').forEach(function (it) {
    it.addEventListener('click', function (e) {
      e.stopPropagation();
      var act = it.dataset.fabAct;
      closeFabMenu();
      if (act === '录音') startRec();
      else if (act === '隐藏') hideFab();
      else toast(act);
    });
  });
  document.addEventListener('click', closeFabMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fabMenu && !fabMenu.hidden) { closeFabMenu(); fab.focus({ preventScroll: true }); return; }
    /* H：找回被隐藏的数字分身（隐藏后右键已经点不到了） */
    if ((e.key === 'h' || e.key === 'H') && fab.classList.contains('is-hidden')) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      fab.classList.remove('is-hidden');
      toast('数字分身已恢复');
    }
  });

  /* ---------- 数字分身：表情演出（眨眼 / 点头 / 摇头 / 开心 / 蹦跶） ----------
     眨眼是常态（隔 3~7s 一次）；每 5~10s 随机演一个小动作：
     · is-nod   点头   · is-shake 摇头   · is-happy 开心（^^ 笑眼 + 咧嘴）
     · is-jump  蹦跶（整颗球离地，落地压扁） */
  (function () {
    var rmq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    /* 第 20 轮：录音条 / 隐藏态不播表情动作 —— fabJump 的落地压扁会把整条工具条
       连同里面的圆点一起做非等比缩放（圆点变椭圆，就是「圆形被压扁」的来源） */
    function canPlay() {
      return !(rmq && rmq.matches) && !drag.on && !document.hidden
        && !fab.classList.contains('is-recording') && !fab.classList.contains('is-hidden');
    }

    function play(cls, ms) {
      if (!canPlay()) return;
      fab.classList.remove(cls);
      void fab.offsetWidth;              /* 摘类→重排→加类，同一动作连点也能重播 */
      fab.classList.add(cls);
      setTimeout(function () { fab.classList.remove(cls); }, ms);
    }
    function blink() {
      if (!canPlay()) return;
      fab.classList.add('is-blink');
      setTimeout(function () { fab.classList.remove('is-blink'); }, 260);
    }

    function blinkLoop() {
      setTimeout(function () { blink(); blinkLoop(); }, 3200 + Math.random() * 3800);
    }
    var acts = [
      ['is-nod', 880],
      ['is-shake', 840],
      ['is-happy', 1080],
      ['is-jump', 940]
    ];
    function actLoop() {
      setTimeout(function () {
        var a = acts[Math.floor(Math.random() * acts.length)];
        play(a[0], a[1]);
        actLoop();
      }, 5200 + Math.random() * 5200);
    }
    /* 呼吸：不能常驻（常驻缩放 = 永久半像素采样 = 模糊），改成每 6~9s 播 1.9s */
    function breatheLoop() {
      setTimeout(function () {
        play('is-breathe', 1900);
        breatheLoop();
      }, 6000 + Math.random() * 3000);
    }
    blinkLoop();
    actLoop();
    breatheLoop();

    /* 首屏打个招呼：先笑一下，再蹦一下，让人知道她是「活的」 */
    setTimeout(function () { play('is-happy', 1080); }, 900);
    setTimeout(function () { play('is-jump', 940); }, 2400);

    /* 悬停打个招呼（点头），点一下开心给你看 */
    fab.addEventListener('pointerenter', function () { play('is-nod', 880); });
    fab.addEventListener('click', function () { play('is-happy', 1080); });

    /* 眼随手动：脑袋朝鼠标方向偏 1.5px（用独立 translate 属性，不跟 transform 动画抢） */
    var bodyEl = fab.querySelector('.fab-body');
    var lookRaf = 0, lookPt = null;
    function applyLook() {
      lookRaf = 0;
      if (!bodyEl) return;
      if (!lookPt || drag.on) { bodyEl.style.translate = ''; return; }
      var r = fab.getBoundingClientRect();
      var dx = lookPt.x - (r.left + r.width / 2);
      var dy = lookPt.y - (r.top + r.height / 2);
      var d = Math.max(1, Math.hypot(dx, dy));
      var k = Math.min(1, d / 220);
      /* 取整到整像素：小数 px 会让 56px 的 SVG 停在半像素上被双线性插值 → 发糊 */
      var tx = Math.round(dx / d * 2 * k);
      var ty = Math.round(dy / d * 2 * k);
      var v = (tx || ty) ? tx + 'px ' + ty + 'px' : '';
      if (bodyEl.style.translate !== v) bodyEl.style.translate = v;
    }
    window.addEventListener('pointermove', function (e) {
      lookPt = { x: e.clientX, y: e.clientY };
      if (!lookRaf) lookRaf = requestAnimationFrame(applyLook);
    }, { passive: true });
  })();

  /* ---------- 版本号：按字形墨迹做光学垂直对齐（字体不同也对得上） ---------- */
  function alignVersion() {
    var vt = document.querySelector('.version-txt');
    if (!vt) return;
    vt.style.transform = 'none';
    var cs = getComputedStyle(vt);
    var c = document.createElement('canvas').getContext('2d');
    c.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var m = c.measureText(vt.textContent || '');
    if (!m.actualBoundingBoxAscent) return;
    var probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    vt.appendChild(probe);
    var r = vt.getBoundingClientRect();
    var baseline = probe.getBoundingClientRect().bottom - r.top;
    probe.remove();
    var inkMid = baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
    var shift = r.height / 2 - inkMid;
    vt.style.transform = 'translateY(' + shift.toFixed(2) + 'px)';
  }
  alignVersion();
  window.addEventListener('resize', alignVersion);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignVersion);

  /* 窗口变化时把拖动过的分身收回可视区 */
  window.addEventListener('resize', function () {
    if (!fab.style.left) return;
    var fr = frame.getBoundingClientRect();
    var w = fab.offsetWidth, h = fab.offsetHeight;
    var x = Math.round(clamp(parseFloat(fab.style.left), EDGE, fr.width - w - EDGE));
    var y = Math.round(clamp(parseFloat(fab.style.top), EDGE, fr.height - h - EDGE));
    fab.style.left = x + 'px'; fab.style.top = y + 'px';
  });

  /* ---------- 场景卡：idle 80 → 看板 192 → 折叠 60 ---------- */
  var scene = document.getElementById('scene');
  var scIdle = document.getElementById('scIdle');
  var scFold = document.getElementById('scFold');

  /* 第 30 轮：会话页 / 任务页没有场景卡，这里退化成空集合，后续调用自然无副作用 */
  var scMetrics = scene ? [].slice.call(scene.querySelectorAll('.sc-metric-v[data-count]')) : [];
  var scRaf = 0;

  /* 指标数字滚动：0 → 目标，easeOutCubic；prefers-reduced-motion 直接落终值 */
  function scPlayNumbers() {
    cancelAnimationFrame(scRaf);
    if (reduced) {
      scMetrics.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }
    var t0 = performance.now(), dur = 720;
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      scMetrics.forEach(function (el) {
        el.textContent = Math.round(+el.dataset.count * e) + (el.dataset.suffix || '');
      });
      if (p < 1) scRaf = requestAnimationFrame(tick);
    }
    scRaf = requestAnimationFrame(tick);
  }

  function setScene(st) {
    scene.dataset.state = st;
    var open = st === 'open';
    scFold.setAttribute('aria-expanded', open ? 'true' : 'false');
    scFold.setAttribute('aria-label', open ? '折叠看板' : '展开看板');
    scFold.setAttribute('data-tip', open ? '折叠看板' : '展开看板');
    /* 折叠态整卡就是一个「展开看板」按钮：补语义 + 可聚焦，展开后收回 */
    if (st === 'collapsed') {
      scene.setAttribute('role', 'button');
      scene.setAttribute('tabindex', '0');
      scene.setAttribute('aria-label', '展开用户洞察看板');
    } else {
      scene.removeAttribute('role');
      scene.removeAttribute('tabindex');
      scene.removeAttribute('aria-label');
    }
    /* 每次展开都重放：数字滚动 + 折线自左向右绘制（摘类→重排→加类 才能重播） */
    scene.classList.remove('is-drawing');
    cancelAnimationFrame(scRaf);
    if (open) {
      void scene.offsetWidth;
      scene.classList.add('is-drawing');
      scMetrics.forEach(function (el) { el.textContent = '0' + (el.dataset.suffix || ''); });
      setTimeout(scPlayNumbers, 140);
    }
    syncStageScroll();
  }
  if (scIdle) scIdle.addEventListener('click', function () { setScene('open'); });
  if (scFold) scFold.addEventListener('click', function () {
    setScene(scene.dataset.state === 'open' ? 'collapsed' : 'open');
  });
  /* 折叠后点卡片任意空白处都能展开（头部两个文字按钮仍走自己的动作） */
  if (scene) {
    scene.addEventListener('click', function (e) {
      if (scene.dataset.state !== 'collapsed') return;
      if (e.target.closest('.sc-btn, .sc-fold')) return;
      setScene('open');
    });
    scene.addEventListener('keydown', function (e) {
      if (scene.dataset.state !== 'collapsed' || e.target !== scene) return;
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      setScene('open');
    });
  }

  /* ============================================================
     图标按钮的 tooltip（body 级单例，抽屉 overflow:hidden 也裁不到）
     ============================================================ */
  (function () {
    var tip = document.createElement('div');
    tip.className = 'cds-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    var timer = 0, cur = null;

    function place(el) {
      var r = el.getBoundingClientRect();
      tip.classList.remove('is-above', 'is-below');
      tip.style.left = '0px'; tip.style.top = '0px';
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var above = r.top - th - 10 >= 8;
      var x = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - 8));
      var y = above ? r.top - th - 10 : r.bottom + 10;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.add(above ? 'is-above' : 'is-below');
    }

    function show(el) {
      var txt = el.getAttribute('data-tip');
      if (!txt) return;
      cur = el;
      tip.textContent = txt;
      place(el);
      tip.classList.add('is-on');
    }

    function hide() {
      clearTimeout(timer);
      cur = null;
      tip.classList.remove('is-on');
    }

    function hostOf(t) {
      if (!t || !t.closest) return null;
      var el = t.closest('[data-tip]:not(.chip)');
      return el;
    }

    document.addEventListener('mouseover', function (e) {
      var el = hostOf(e.target);
      if (!el || el === cur) return;
      clearTimeout(timer);
      timer = setTimeout(function () { show(el); }, 280);
    });
    document.addEventListener('mouseout', function (e) {
      var el = hostOf(e.target);
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      hide();
    });
    document.addEventListener('focusin', function (e) {
      var el = hostOf(e.target);
      if (el) show(el);
    });
    document.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
  })();

  /* ============================================================
     云端任务同步 · 模态（layers/modal-a.json / modal-b.json）
     ============================================================ */
  var CM_TASKS = [
    { id: 'TASK-20261102002', title: '登录失败提示异常分支补齐', meta: '我执行 · paa-web', run: true, on: true,
      goal: '补齐登录服务不可用和网络中断时的提示，保留原表单输入并允许重新提交。补齐登录服务不可用和网络中断时的提示，保留原表单输入并允许重新提交。',
      dir: 'paa-web', path: '/Users/yuanqi/paa-web', branch: 'feat/login-error-fallback' },
    { id: 'TASK-20261102003', title: '账号锁定提示交互走查', meta: '我协作 · paa-web', run: true, on: true,
      goal: '梳理账号锁定后的提示层级与倒计时展示，输出交互走查清单并对齐视觉稿。',
      dir: 'paa-web', path: '/Users/yuanqi/paa-web', branch: 'feat/account-lock-hint' },
    { id: 'TASK-20261102004', title: '登录错误码兼容性回归', meta: '我执行 · paa-auth', run: false, on: true,
      goal: '覆盖旧版调用方的错误码分支，确认 401/403/500 的兜底文案与跳转行为保持不变。',
      dir: 'paa-auth', path: '/Users/yuanqi/paa-auth', branch: 'test/login-error-codes' },
    { id: 'TASK-20261102005', title: '核对旧版调用方对登录错误的兼容', meta: '我协作 · paa-auth', run: false, on: false,
      goal: '核对旧版客户端对新增错误结构的解析，列出需要保留的字段与降级策略。',
      dir: 'paa-auth', path: '/Users/yuanqi/paa-auth', branch: 'chore/legacy-compat' },
    { id: 'TASK-20261102006', title: '登记现有契约不一致的用例', meta: '我执行 · paa-web', run: false, on: false,
      goal: '把接口契约与实现不一致的用例登记进用例库，标注影响范围与复现步骤。',
      dir: 'paa-web', path: '/Users/yuanqi/paa-web', branch: 'docs/contract-cases' }
  ];

  var cmModal = document.getElementById('syncModal');
  var cmItems = document.getElementById('cmItems');
  var cmAllBtn = document.getElementById('cmAll');
  var cmCountEl = document.getElementById('cmCount');
  var cmSyncBtn = document.getElementById('cmSync');
  var cmMsgs = document.getElementById('cmMsgs');
  var wdSync = document.getElementById('wdSync');
  var cmCur = 0, cmBusy = false, cmSynced = false;

  /* 模态开关（两个弹窗共用）：只切 class，不锁 body —— 蒙层在 panel 内，滚动天然不穿透 */
  function openCdsModal(m) {
    if (!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
  }
  function closeCdsModal(m) {
    if (!m || !m.classList.contains('is-open')) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  }

  var CM_TICK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.2L4.6 8.8L10 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CM_OK = '<span class="ico"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#00A870"/><path d="M5.9 10.3L8.5 12.9L14.2 7.2" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var CM_ERR = '<span class="ico"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#F53F3F"/><path d="M7.2 7.2L12.8 12.8M12.8 7.2L7.2 12.8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></svg></span>';

  function cmRender() {
    cmItems.innerHTML = '';
    CM_TASKS.forEach(function (t, i) {
      var el = document.createElement('div');
      el.className = 'cm-item' + (t.on ? ' is-on' : '') + (i === cmCur ? ' is-cur' : '');
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.dataset.idx = i;
      el.innerHTML =
        '<span class="cm-cb" role="checkbox" aria-checked="' + t.on + '">' + CM_TICK + '</span>' +
        '<div class="cm-item-main">' +
          '<div class="cm-item-t"><span class="cm-item-title">' + t.title + '</span>' +
          '<span class="cm-tag' + (t.run ? ' is-run' : '') + '">' + (t.run ? '进行中' : '未开始') + '</span></div>' +
          '<div class="cm-item-m">' + t.meta + '</div>' +
        '</div>';
      el.addEventListener('click', function (ev) {
        var hitCb = ev.target.closest('.cm-cb');
        if (hitCb) t.on = !t.on;
        else { if (!t.on) t.on = true; }
        cmCur = i;
        cmRender();
        cmDetail();
      });
      cmItems.appendChild(el);
    });
    var n = CM_TASKS.filter(function (t) { return t.on; }).length;
    cmCountEl.textContent = '共 ' + CM_TASKS.length + ' 项，已选 ' + n + ' 项';
    cmAllBtn.textContent = n === CM_TASKS.length ? '反选' : '全选';
    cmSyncBtn.disabled = n === 0 || cmBusy;
  }

  function cmDetail() {
    var t = CM_TASKS[cmCur];
    document.getElementById('cmTaskTitle').textContent = t.title;
    var tag = document.getElementById('cmTaskTag');
    tag.textContent = t.run ? '进行中' : '未开始';
    tag.className = 'cm-tag' + (t.run ? ' is-run' : '');
    document.getElementById('cmTaskId').textContent = t.id;
    document.getElementById('cmGoal').textContent = t.goal;
    document.getElementById('cmDir').textContent = t.dir;
    document.getElementById('cmPath').textContent = t.path;
    document.getElementById('cmBranch').textContent = t.branch;
  }

  function cmOpen() {
    openCdsModal(cmModal);
    cmRender();
    cmDetail();
    setTimeout(function () {
      var c = cmModal.querySelector('.cm-close');
      if (c) c.focus({ preventScroll: true });
    }, 30);
  }
  function cmClose() {
    if (!cmModal.classList.contains('is-open')) return;
    closeCdsModal(cmModal);
    if (wdSync) wdSync.focus({ preventScroll: true });
  }
  wdSync.addEventListener('click', function (e) { e.stopPropagation(); cmOpen(); });
  drawer.querySelectorAll('[data-sync-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); cmOpen(); });
  });
  /* 第 62 轮：顶部「任务证据链」按钮 —— 先只开一个空壳弹窗（正文待补）
     第 63 轮：修正声明顺序 —— evModal 必须先取到，否则 var 提升为 undefined，按钮点了不响应 */
  var evModal = document.getElementById('evModal');
  var tkEvidence = document.getElementById('tkEvidence');
  if (tkEvidence && evModal) {
    tkEvidence.addEventListener('click', function (e) { e.stopPropagation(); openCdsModal(evModal); });
  }
  /* ============================================================
     第 76 轮：变更分析完成态（稿 3376:53726）
     点「开始变更分析」→ 模拟比对 → 输入区收起成「资料输入」条，
     下方列出变更点；卡片支持 忽略/恢复、收起/展开、变更点证据链。
     ============================================================ */
  (function () {
    var wrap = document.querySelector('.tp-wrap');
    var body = document.getElementById('tpBody');
    var chg = document.getElementById('tpChg');
    var list = document.getElementById('tpChgList');
    var countEl = document.getElementById('tpChgCount');
    var startBtn = document.getElementById('tpStart');
    var confirmBtn = document.getElementById('tpConfirm');
    var reBtn = document.getElementById('tpReanalyze');
    var statusEl = document.getElementById('tpBodyStatus');
    var bodyT = document.getElementById('tpBodyT');
    var sectBtn = body ? body.querySelector('[data-tp-toggle="body"]') : null;
    var steps = document.querySelectorAll('.tp-head .tp-step');
    var step1 = steps[0], step2 = steps[1];
    if (!wrap || !chg || !startBtn) return;

    var CHECK = '<span class="ico ico12"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.2 6.2 4.8 8.8 9.8 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    /* 每张步骤卡自己的原始数字，重置时要各归各位（别都用 1） */
    var savedNo = {};
    [step1, step2].forEach(function (st) {
      if (st) savedNo[st.dataset.stepKey || (st.dataset.stepKey = 'k' + Math.random())] = st.querySelector('.tp-step-no').innerHTML;
    });
    function origNo(st) { return savedNo[st.dataset.stepKey] || ''; }

    function recount() {
      var n = list.querySelectorAll('.cp:not(.is-ignored)').length;
      if (countEl) countEl.textContent = '（' + n + '个）';
    }

    function markStep(step, mode) {
      if (!step) return;
      var no = step.querySelector('.tp-step-no');
      step.classList.toggle('is-on', mode === 'on');
      step.classList.toggle('is-done', mode === 'done');
      if (no) no.innerHTML = (mode === 'done') ? CHECK : origNo(step);
    }

    function setAnalyzed(on) {
      wrap.classList.toggle('is-analyzed', on);
      if (body) {
        body.classList.toggle('is-open', !on);
        body.classList.toggle('is-closed', on);
      }
      if (sectBtn) sectBtn.setAttribute('aria-expanded', on ? 'false' : 'true');
      if (bodyT) bodyT.textContent = on ? '资料输入' : '变更分析';
      if (statusEl) statusEl.hidden = !on;
      chg.hidden = !on;
      if (startBtn) startBtn.hidden = on;
      if (confirmBtn) confirmBtn.hidden = !on;
      if (reBtn) reBtn.hidden = !on;
      markStep(step1, on ? 'done' : 'on');
      if (!on) markStep(step2, 'idle');
      if (on) { recount(); wrap.scrollTop = 0; }
    }

    /* 开始变更分析：先给 900ms 的「比对中」反馈，再落到完成态 */
    startBtn.addEventListener('click', function () {
      if (startBtn.disabled) return;
      var old = startBtn.textContent;
      startBtn.disabled = true;
      startBtn.textContent = '正在比对仓库与分支…';
      setTimeout(function () {
        startBtn.disabled = false;
        startBtn.textContent = old;
        setAnalyzed(true);
        toast('已比对 2 个仓库 · 发现 4 个变更点');
      }, 900);
    });

    if (reBtn) reBtn.addEventListener('click', function () {
      setAnalyzed(false);
      toast('已重新打开资料输入，可调整后再分析');
    });

    if (confirmBtn) confirmBtn.addEventListener('click', function () {
      markStep(step1, 'done');
      markStep(step2, 'on');
      toast('已确认变更范围，开始生成代码');
    });

    function setIgnored(card, on) { card.classList.toggle('is-ignored', on); }

    /* 卡片上的三个操作 + 恢复 */
    if (list) list.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var card = btn.closest('.cp');
      if (!card) return;
      if (btn.hasAttribute('data-cp-ignore')) {
        setIgnored(card, true);
        recount();
        toast('已忽略该变更点');
      } else if (btn.hasAttribute('data-cp-restore')) {
        setIgnored(card, false);
        recount();
      } else if (btn.hasAttribute('data-cp-range')) {
        var off = card.classList.toggle('is-range-off');
        var t = btn.querySelector('.cp-range-t');
        if (t) t.textContent = off ? '展开' : '收起';
      } else if (btn.hasAttribute('data-cp-evidence') && evModal) {
        openCdsModal(evModal);
      }
    });

    /* 添加变更点：把焦点交给右栏 AI 输入框（提示词描述 → AI 补全） */
    var addBtn = document.getElementById('tpChgAdd');
    if (addBtn) addBtn.addEventListener('click', function () {
      var ai = document.querySelector('.ai-input');
      if (ai) {
        var side = document.querySelector('.panel');
        if (side && side.classList.contains('is-ai-off')) {
          var open = document.getElementById('aiOpen');
          if (open) open.click();
        }
        setTimeout(function () { ai.focus(); }, 60);
        toast('在右栏描述要补充的变更，AI 会补全变更点');
      } else {
        toast('已添加变更点');
      }
    });

    /* 排序：实现时间 ⇄ 风险 */
    var sortBtn = document.getElementById('tpChgSort');
    var sortT = document.getElementById('tpChgSortT');
    var order = [].slice.call(list.querySelectorAll('.cp'));
    var byRisk = false;
    if (sortBtn) sortBtn.addEventListener('click', function () {
      byRisk = !byRisk;
      var weight = { high: 3, mid: 2, low: 1 };
      var arr = order.slice();
      if (byRisk) {
        arr.sort(function (a, b) { return (weight[b.dataset.risk] || 0) - (weight[a.dataset.risk] || 0); });
      }
      arr.forEach(function (c) { list.appendChild(c); });
      /* 分隔线始终留在一组已忽略项之前 */
      var sep = list.querySelector('.tp-chg-sep');
      var firstIgnored = list.querySelector('.cp.is-ignored');
      if (sep && firstIgnored) list.insertBefore(sep, firstIgnored);
      if (sortT) sortT.textContent = byRisk ? '按风险排序' : '按实现时间排序';
    });
  })();

  /* ============================================================
     第 72 轮：右栏「任务产物」的文件卡 —— 不再开弹窗，改成在中栏 tk-tabs-l 新开一个
     以文件名命名的页签，正文就地浏览（#docModal 已下线）。
     同一个文件重复点只切页签，不重复开；关掉页签自动退回上一个页签 + 变更分析面板。
     ============================================================ */
  var tkDoc = document.getElementById('tkDoc');
  var panelMainEl = document.getElementById('panelMain');
  var tkTabsL = document.querySelector('.task-tabs .tk-tabs-l');
  var DOC_ICON = '<span class="ico ico14" aria-hidden="true"><svg viewBox="0 0 14 14" fill="none"><path d="M3.4 1.9h4.2l2.5 2.5v7.7H3.4z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M7 2.1v2.6h2.6" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg></span>';
  var DOC_X = '<span class="tk-x"><span class="ico ico12"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3.4 3.4 8.6 8.6M8.6 3.4 3.4 8.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></span></span>';

  /* 页签 ⇄ 中栏内容的联动：
       · 亮的文件页签  → 文档视图（is-doc）
       · 变更 / Git / 终端 / 浏览器 → 内容先留空（is-empty）
       · 概要设计      → 回到变更分析（两者都不加） */
  var syncDocPane = function () {
    if (!tkDoc || !tkTabsL) return;
    var on = tkTabsL.querySelector('.tk-tab.is-on');
    var isFile = !!(on && on.dataset.docName);
    var isEmpty = !!(on && on.dataset.empty) && !isFile;
    if (panelMainEl) {
      panelMainEl.classList.toggle('is-doc', isFile);
      panelMainEl.classList.toggle('is-empty', isEmpty);
    }
    if (!isFile) return;
    var kind = on.dataset.docKind || 'md';
    tkDoc.querySelectorAll('[data-doc-pane]').forEach(function (pane) {
      var match = pane.getAttribute('data-doc-pane') === kind;
      pane.hidden = !match;
      pane.classList.toggle('is-active', match);
    });
    tkDoc.scrollTop = 0;
  };

  if (tkDoc && tkTabsL) {
    document.querySelectorAll('.ai-file').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = card.dataset.name || '未命名文件';
        var kind = card.dataset.doc || 'md';
        var tab = null;
        tkTabsL.querySelectorAll('.tk-tab[data-doc-name]').forEach(function (t) {
          if (t.dataset.docName === name) tab = t;
        });
        if (!tab) {
          tab = document.createElement('button');
          tab.className = 'tk-tab';
          tab.type = 'button';
          tab.setAttribute('role', 'tab');
          tab.setAttribute('aria-selected', 'false');
          tab.setAttribute('data-doc-name', name);
          tab.setAttribute('data-doc-kind', kind);
          tab.title = name;
          tab.innerHTML = DOC_ICON + '<span class="tk-tab-name">' + name + '</span>' + DOC_X;
          var vsep = tkTabsL.querySelector('.tk-vsep');
          if (vsep) tkTabsL.insertBefore(tab, vsep); else tkTabsL.appendChild(tab);
        }
        tab.click();   /* 走页签的统一点击逻辑：只亮自己 + 联动文档面板 */
      });
    });
  }
  /* 两个模态共用同一套关闭语义：点蒙层 / 点取消 / 点右上角 × */
  var stgModal = document.getElementById('stgModal');
  /* 第 62 轮：任务页新增「任务证据链」弹窗，并入同一套开关与关闭语义。
     它只在任务页存在，其余页面取到 null，所以要过滤掉空值再绑 */
  [cmModal, qfModal, stgModal, evModal].filter(function (m) { return !!m; }).forEach(function (m) {
    m.querySelectorAll('[data-modal-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeCdsModal(m); });
    });
  });
  /* 模态在最上层：Esc 先关模态，不再触发抽屉收起 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var top = (evModal && evModal.classList.contains('is-open')) ? evModal
      : (stgModal.classList.contains('is-open') ? stgModal
      : (qfModal.classList.contains('is-open') ? qfModal
      : (cmModal.classList.contains('is-open') ? cmModal : null)));
    if (!top) return;
    e.stopPropagation();
    closeCdsModal(top);
  }, true);

  /* ---------- 第 24 轮：设置弹窗 ---------- */
  var tbSettings = document.getElementById('tbSettings');
  if (tbSettings && stgModal) {
    tbSettings.addEventListener('click', function (e) { e.stopPropagation(); openCdsModal(stgModal); });
    /* 左栏切分类 */
    stgModal.querySelectorAll('.stg-item').forEach(function (item) {
      item.addEventListener('click', function () {
        stgModal.querySelectorAll('.stg-item').forEach(function (x) { x.classList.toggle('is-active', x === item); });
        stgModal.querySelectorAll('.stg-pane').forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.stgPane === item.dataset.stg);
        });
        stgModal.querySelector('.stg-main').scrollTop = 0;
      });
    });
    /* 开关 */
    stgModal.querySelectorAll('.stg-sw').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var on = sw.classList.toggle('is-on');
        sw.setAttribute('aria-checked', on ? 'true' : 'false');
        var label = sw.closest('.stg-row').querySelector('.stg-k').textContent;
        toast(label + (on ? ' 已开启' : ' 已关闭'));
      });
    });
    /* 分段（组内单选） */
    stgModal.querySelectorAll('.stg-seg').forEach(function (seg) {
      seg.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        });
      });
    });
    /* 选择目录 / 连接器按钮：原型里先给反馈 */
    stgModal.querySelectorAll('[data-stg-pick], [data-stg-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        toast(b.dataset.stgAct || '选择默认工作目录');
      });
    });
  }

  cmAllBtn.addEventListener('click', function () {
    var all = CM_TASKS.every(function (t) { return t.on; });
    CM_TASKS.forEach(function (t) { t.on = !all; });
    cmRender();
  });

  cmModal.querySelectorAll('.cm-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      cmModal.querySelectorAll('.cm-tab').forEach(function (x) {
        x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var k = tab.dataset.cmTab;
      cmModal.querySelectorAll('.cm-pane').forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.cmPane === k);
      });
    });
  });

  function cmMsg(kind, text) {
    var el = document.createElement('div');
    el.className = 'cm-msg' + (kind === 'error' ? ' is-error' : '');
    el.innerHTML = (kind === 'error' ? CM_ERR : CM_OK) + '<span>' + text + '</span>';
    cmMsgs.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 240);
    }, 2400);
  }

  cmSyncBtn.addEventListener('click', function () {
    if (cmBusy) return;
    if (!CM_TASKS.some(function (t) { return t.on; })) return;
    cmBusy = true;
    cmSyncBtn.classList.add('is-busy');
    cmSyncBtn.disabled = true;
    cmSyncBtn.textContent = '同步中';
    setTimeout(function () {
      cmBusy = false;
      cmSyncBtn.classList.remove('is-busy');
      cmSyncBtn.disabled = false;
      cmSyncBtn.textContent = '开始同步';
      if (cmSynced) {
        cmMsg('error', '云端任务同步失败，请重试');
      } else {
        cmSynced = true;
        cmMsg('ok', '云端任务同步完成');
      }
    }, 1600);
  });

  /* ---------- 背景方案切换（B 循环 / ?bg= / localStorage） ---------- */
  var BG_KEY = 'cecoder.bg.v3';   /* 第 39 轮：换 key —— 默认改成稿件渐变，旧选择一律作废 */
  var BG_LIST = [
    ['design', '渐变 · 设计稿'],
    ['ai', '极光 · AI 氛围'],
    ['grid', '工程网格']
  ];

  function applyBg(name, silent) {
    var valid = BG_LIST.some(function (x) { return x[0] === name; });
    var key = valid ? name : 'design';
    frame.dataset.bg = key;
    if (silent) return;
    BG_LIST.forEach(function (x) { if (x[0] === key) toast('背景：' + x[1]); });
  }

  var bgFromUrl = null;
  try { bgFromUrl = new URLSearchParams(location.search).get('bg'); } catch (e) {}
  var bgSaved = null;
  try { bgSaved = localStorage.getItem(BG_KEY); } catch (e) {}
  applyBg(bgFromUrl || bgSaved || 'design', true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'b' && e.key !== 'B') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var cur = frame.dataset.bg || 'ai';
    var i = 0;
    BG_LIST.forEach(function (x, n) { if (x[0] === cur) i = n; });
    var next = BG_LIST[(i + 1) % BG_LIST.length][0];
    applyBg(next, false);
    try { localStorage.setItem(BG_KEY, next); } catch (err) {}
  });

  /* ============================================================
     第 30 轮：三个页面的内容渲染与路由初始化
     ============================================================ */
  function chatInner() {
    return chatView && chatView.querySelector('.chat-pane[data-chat-pane="dialog"] .chat-inner');
  }
  var CHAT_SEED = chatInner() ? chatInner().innerHTML : '';

  function appendMe(text) {
    var inner = chatInner(); if (!inner) return;
    var msg = document.createElement('div');
    msg.className = 'chat-msg is-me';
    var bub = document.createElement('div');
    bub.className = 'chat-bubble is-text';
    bub.textContent = text;
    msg.appendChild(bub);
    inner.appendChild(msg);
    if (chatView) chatView.scrollTop = chatView.scrollHeight;
  }
  function appendAi() {
    var inner = chatInner(); if (!inner) return;
    var msg = document.createElement('div');
    msg.className = 'chat-msg is-ai';
    var who = document.createElement('span');
    who.className = 'chat-who';
    who.textContent = 'Cecoder';
    var sk = document.createElement('div');
    sk.className = 'sk';
    [56, 92, 68].forEach(function (w) {
      var i = document.createElement('i');
      i.style.setProperty('--w', w + '%');
      sk.appendChild(i);
    });
    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.setAttribute('aria-label', '正在生成');
    typing.innerHTML = '<i></i><i></i><i></i>';
    msg.appendChild(who); msg.appendChild(sk); msg.appendChild(typing);
    inner.appendChild(msg);
    if (chatView) chatView.scrollTop = chatView.scrollHeight;
  }

  var lastSession = -1;
  function applySession(i) {
    var list = sessCards(); var c = list[i]; if (!c) return;
    markSel(list, c);
    var t = c.querySelector('.wd-sess-title');
    var name = t ? t.textContent.replace(/\s+/g, ' ').trim() : '会话';
    document.title = 'Cecoder · ' + name;
    var inner = chatInner();
    if (inner && i !== lastSession) { inner.innerHTML = CHAT_SEED; lastSession = i; }
    if (chatView) chatView.scrollTop = chatView.scrollHeight;
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el && txt != null) el.textContent = txt;
  }
  function applyTask(i) {
    var list = taskCards(); var c = list[i]; if (!c) return;
    markSel(list, c);
    var pick = function (sel) { var e = c.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var title = pick('.wd-card-title') || '任务执行';
    var sub = pick('.wd-card-sub');
    var cnt = pick('.wd-card-cnt');
    var chip = pick('.wd-chip');
    var grpEl = c.closest('.wd-grp');
    var grp = grpEl ? (grpEl.querySelector('.wd-grp-name') || {}).textContent : '';
    var dones = c.querySelectorAll('.wd-bar i.on').length;
    var total = c.querySelectorAll('.wd-bar i').length;

    document.title = 'Cecoder · ' + title;
    /* 第 34 轮：标题栏换成工序进度模块，任务名只在 <title> 与左侧卡片上体现；
       工序条按稿件固定 9 道（进度 4/9），这里不再回写 DOM */
  }

  (function bootPages() {
    var tab = QS.get('tab');
    /* 第 31 轮：页签记忆 —— 子页面按自身性质固定；首页按上次停留（任务/会话）还原 */
    if (PAGE === 'session') tab = '会话';
    else if (PAGE === 'task') tab = '任务';
    else if (!tab) {
      try { tab = localStorage.getItem('cecoder.wdTab') || ''; } catch (err) { tab = ''; }
      /* 第 38 轮：页签互换（会话在前）后，首次进入默认落在「会话」 */
      if (tab !== '会话' && tab !== '任务') tab = '会话';
    }
    var id = parseInt(QS.get('id') || '', 10);
    if (isNaN(id)) id = -1;
    var sel = parseInt(QS.get('sel') || '', 10);
    if (isNaN(sel)) sel = -1;
    var wantSel = sel >= 0 ? sel : id;
    /* 第 32 轮：「新建会话」跳首页时带 new=1 —— 不预选任何一条会话，把光标直接放进输入框 */
    var isNew = QS.get('new') === '1';

    /* 会话页 / 任务页：输入框占位各自贴合场景 */
    if (PAGE === 'session') ta.placeholder = CHAT_PH;
    if (PAGE === 'task') ta.placeholder = '补充任务要求，或继续追问…';

    /* 子页面：任务列表默认摊开，方便在会话/任务间来回切 */
    if (PAGE !== 'home' && !drawer.classList.contains('is-open')) {
      var mb = document.querySelector('.menu-btn');
      if (mb) mb.click();
    }

    function pickSession(i) {
      var list = sessCards(); if (!list.length) return;
      markSel(list, list[clampId(i, list.length)]);
    }

    if (tab === '会话') {
      /* 回列表时保留刚才那一条的选中（?sel=N）；新建会话（new=1）则一条都不选 */
      if (PAGE === 'home' && (wantSel >= 0 || isNew)) SUPPRESS_TAB_SEL = true;
      if (PAGE === 'session' && id >= 0) SUPPRESS_TAB_SEL = true;
      var st = drawer.querySelector('[data-wd-tab="会话"]'); if (st) st.click();
      if (PAGE === 'session') openSession(id < 0 ? 0 : id);
      else if (PAGE === 'home' && !isNew) { if (wantSel >= 0) pickSession(wantSel); else selectFirstSession(); }
      else if (PAGE === 'home') { markSel(sessCards(), null); }
    } else if (tab === '任务') {
      var tt = drawer.querySelector('[data-wd-tab="任务"]'); if (tt) tt.click();
      if (PAGE === 'task') openTask(id < 0 ? 0 : id);
    } else if (PAGE === 'session') {
      openSession(id < 0 ? 0 : id);
    } else if (PAGE === 'task') {
      openTask(id < 0 ? 0 : id);
    }

    /* 首页输入的这句话，落到会话页作为第一条消息 */
    var seed = '';
    try { seed = sessionStorage.getItem('cecoder.seed') || ''; } catch (err) {}
    if (PAGE === 'session' && seed) {
      try { sessionStorage.removeItem('cecoder.seed'); } catch (err) {}
      appendMe(seed);
      appendAi();
    }

    /* 新建会话：落在首页形态时把焦点交给输入框（等布局稳定再聚焦，避免拉出滚动条） */
    if (isNew && PAGE === 'home') {
      var stg = document.querySelector('.stage');
      if (stg) stg.scrollTop = 0;
      requestAnimationFrame(function () {
        try { ta.focus({ preventScroll: true }); } catch (err) {}
      });
    }
  })();

  /* ============================================================
     第 34 轮：任务执行页「工序进度」模块（稿 3113:44395）
     1) 工序连线按圆心算（宽度随工序名长短变化，CSS 算不出来）
     2) 顶部三段视图切换 / 底部工序资产页签（切换、关闭、新建、收起）
     ============================================================ */
  /* 第 62 轮：顶部那条已收成单颗「任务证据链」按钮（宿主在模态那段里绑），
     这里只剩工序条的逻辑，不再需要 .tt-links 容器 */
  var tkSteps = document.getElementById('tkStepBar');
  if (tkSteps) {
    var stepItems = [].slice.call(tkSteps.querySelectorAll('.ts-item'));
    var stepLinks = [].slice.call(tkSteps.querySelectorAll('.ts-link'));
    var stepScroll = document.getElementById('tkStepScroll');
    var panelMain = document.querySelector('.panel-main');
    /* 第 46 轮：折叠开关从「工序进度」那段里独立出来，挂在自己的「收起」按钮上 */
    var stepsBtn = document.getElementById('tkStepsToggle');
    /* 第 36 轮：底部那条是滚动条 —— 滑块按「视口/内容」算长度，跟着 scrollLeft 走 */
    var sb = document.getElementById('tkStepProg');
    var sbThumb = sb ? sb.querySelector('.ts-prog-thumb') : null;

    /* 连线：左端 = 上一圆点右缘 + 8，右端 = 本圆点左缘 − 8（圆心各 ±20） */
    function layoutSteps() {
      if (!stepItems.length) return;
      /* 折起来时圆点宽高为 0，连线位置没意义，直接跳过 */
      if (panelMain && panelMain.classList.contains('is-steps-off')) {
        stepLinks.forEach(function (lk) { lk.hidden = true; });
        if (sb) sb.classList.remove('is-on');
        return;
      }
      /* 连线是 .ts-track 的绝对定位子元素：left 以 track 的 padding box 左缘为 0
         （track 用 margin:auto 居中时，这个左缘和滚动容器不一定重合） */
      var trackEl = document.getElementById('tkStepTrack');
      var base = trackEl ? trackEl.getBoundingClientRect().left : 0;
      /* 第 46 轮：工序项改成横排（图标在左、文字在右），连线要按「图标的左右缘 ±8」算，
         不能再拿整个 item 的中心（名字一长，中心就跑到文字上去了）
         第 64 轮：按用户要求恢复这一版（圆心到圆心那版会横穿文字，效果不对） */
      var boxes = stepItems.map(function (it) {
        var r = it.getBoundingClientRect();
        return { l: r.left - base, r: r.right - base };
      });
      stepLinks.forEach(function (lk, i) {
        if (!boxes[i] || !boxes[i + 1]) { lk.hidden = true; return; }
        lk.hidden = false;
        var l = boxes[i].r + 8, rgt = boxes[i + 1].l - 8;
        lk.style.left = Math.round(l) + 'px';
        lk.style.width = Math.max(0, Math.round(rgt - l)) + 'px';
      });
      syncScrollbar();
    }

    /* 滚动条：放得下 → 整条不出现；放不下 → 淡入，滑块长 = 视口/内容 */
    function syncScrollbar() {
      if (!sb || !sbThumb || !stepScroll) return;
      var cw = stepScroll.clientWidth, sw = stepScroll.scrollWidth;
      var on = cw > 0 && sw > cw + 1;
      sb.classList.toggle('is-on', on);
      if (!on) return;
      var track = sb.clientWidth;                       /* 左右各缩 16 之后可用的长度 */
      var max = sw - cw;
      var w = Math.round(track * cw / sw);
      w = Math.max(40, Math.min(track, w));
      var x = max > 0 ? Math.round((track - w) * (stepScroll.scrollLeft / max)) : 0;
      sbThumb.style.width = w + 'px';
      sbThumb.style.transform = 'translateX(' + Math.max(0, Math.min(track - w, x)) + 'px)';
    }

    if (sb && sbThumb && stepScroll) {
      stepScroll.addEventListener('scroll', syncScrollbar, { passive: true });
      /* 拖滑块：位移按「可拖距离 / 可滚距离」等比放大 */
      var sbDrag = null;
      sbThumb.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        sbDrag = { x: e.clientX, s: stepScroll.scrollLeft };
        sb.classList.add('is-drag');
        try { sbThumb.setPointerCapture(e.pointerId); } catch (err) {}
      });
      sbThumb.addEventListener('pointermove', function (e) {
        if (!sbDrag) return;
        var track = sb.clientWidth, w = sbThumb.offsetWidth;
        var max = stepScroll.scrollWidth - stepScroll.clientWidth;
        var room = track - w;
        if (room > 0) stepScroll.scrollLeft = sbDrag.s + (e.clientX - sbDrag.x) * max / room;
        syncScrollbar();
      });
      function endDrag(e) {
        if (!sbDrag) return;
        sbDrag = null;
        sb.classList.remove('is-drag');
        try { sbThumb.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      sbThumb.addEventListener('pointerup', endDrag);
      sbThumb.addEventListener('pointercancel', endDrag);
      /* 点轨道空白：滚到点击处（滑块中心对齐指针） */
      sb.addEventListener('pointerdown', function (e) {
        if (e.target === sbThumb) return;
        var r = sb.getBoundingClientRect();
        var ratio = (e.clientX - r.left) / r.width;
        stepScroll.scrollLeft = ratio * stepScroll.scrollWidth - stepScroll.clientWidth / 2;
        syncScrollbar();
      });
    }

    layoutSteps();
    window.addEventListener('resize', layoutSteps);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutSteps);
    setTimeout(layoutSteps, 60);
    /* 第 39 轮：左侧抽屉是「宽度动画展开」的，动画期间 panel-main 会从 1424 收到 1104，
       60ms 那次量到的是中间态，连线就永远按错误圆心画着了（以前靠首页解析期展开掩盖了）。
       用 ResizeObserver 盯住滚动容器：抽屉开合 / 右栏挤压 / 窗口缩放都能重新对位 */
    if (window.ResizeObserver && stepScroll) {
      new ResizeObserver(function () { layoutSteps(); }).observe(stepScroll);
    }
    /* 第 71 轮：进度推到第 5 道工序后，「当前」会落在可视区外 —— 首次进来把它居中，
       否则只看得到前 4 道，看不出进度走到哪了 */
    (function revealNow() {
      var nowItem = tkSteps.querySelector('.ts-item.is-now');
      if (!nowItem || !stepScroll) return;
      function run() {
        var r = nowItem.getBoundingClientRect(), vr = stepScroll.getBoundingClientRect();
        var pad = 16, d = 0;                                    /* 只滚到「刚好露全」，留住左边上下文 */
        if (r.right > vr.right - pad) d = r.right - (vr.right - pad);
        else if (r.left < vr.left + pad) d = r.left - (vr.left + pad);
        if (!d) return;
        stepScroll.scrollLeft += d;
        layoutSteps();
      }
      setTimeout(run, 120);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(run, 0); });
    })();

    /* 折叠：点已选中的「工序进度」把整条工序栏收起，再点展开 */
    function setStepsOff(off) {
      if (!panelMain) return;
      panelMain.classList.toggle('is-steps-off', off);
      if (stepsBtn) {
        stepsBtn.setAttribute('aria-expanded', off ? 'false' : 'true');
        /* 文案跟着状态走：收起 ⇄ 展开 */
        var t = stepsBtn.firstChild;
        if (t && t.nodeType === 3) t.nodeValue = off ? '展开' : '收起';
      }
      if (off) {
        /* 折起来时圆点宽高归零，连线/滚动条先收掉，别留一条贴在顶栏下沿 */
        stepLinks.forEach(function (lk) { lk.hidden = true; });
        if (sb) sb.classList.remove('is-on');
      } else requestAnimationFrame(layoutSteps);
    }

    /* 「收起 / 展开」：单独一颗键控制工序条 */
    if (stepsBtn) {
      stepsBtn.addEventListener('click', function () {
        setStepsOff(!(panelMain && panelMain.classList.contains('is-steps-off')));
      });
    }

    var runBtn = document.getElementById('tkRun');
    if (runBtn) runBtn.addEventListener('click', function () { setAiPanel(true); toast('已开始自动执行'); });

    /* 第 68 轮：右栏「AI 协作」—— 默认展开（工序一开始执行就把它带出来）；
       头部 ›| 向右收起，收起后工具条 tt-now 右侧长出「AI 协作」入口，点它再呼出 */
    var aiSide = document.getElementById('aiSide');
    var aiOpenBtn = document.getElementById('tkAiOpen');
    var aiFoldBtn = document.getElementById('aiFold');
    var panelBox = document.querySelector('.panel');
    function setAiPanel(open) {
      if (!panelBox || !aiSide) return;
      panelBox.classList.toggle('is-ai-off', !open);
      aiSide.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (aiOpenBtn) aiOpenBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (aiFoldBtn) aiFoldBtn.addEventListener('click', function () { setAiPanel(false); toast('AI 协作已收起'); });
    if (aiOpenBtn) aiOpenBtn.addEventListener('click', function () { setAiPanel(true); });

    /* 第 69 轮：附件两张图各自可删；删空就整条收掉 */
    var aiAtts = document.getElementById('aiAtts');
    if (aiAtts) {
      aiAtts.addEventListener('click', function (e) {
        var x = e.target.closest('.ai-att-x');
        if (!x) return;
        var att = x.closest('.ai-att');
        var left = aiAtts.querySelectorAll('.ai-att').length - 1;
        if (att) att.remove();
        if (!left) aiAtts.hidden = true;
        toast(left ? '已移除参考图，还剩 ' + left + ' 张' : '已移除全部参考图');
      });
    }

    /* 第 70 轮：截图带 —— 每张独立，点击开蒙层看大图；末张「+2」落到最后一张 */
    var aiShots = document.getElementById('aiShots');
    var shotViewer = document.getElementById('shotViewer');
    if (aiShots && shotViewer) {
      var shotImg = document.getElementById('shotViewerImg');
      var shotCap = document.getElementById('shotViewerCap');
      var shotTiles = [].slice.call(aiShots.querySelectorAll('.ai-shot'));
      var shotFulls = shotTiles.filter(function (el) { return !!el.dataset.full; });
      var shotIdx = 0;

      function shotShow(i) {
        if (!shotFulls.length) return;
        shotIdx = (i + shotFulls.length) % shotFulls.length;
        var tile = shotFulls[shotIdx];
        var next = tile.dataset.full;
        /* 第 74 轮：换图时淡入，避免大图硬切；同图重开不重置透明度 */
        if (shotImg.getAttribute('src') !== next) {
          shotImg.style.opacity = '0';
          shotImg.onload = function () { shotImg.style.opacity = '1'; };
          shotImg.src = next;
        }
        shotImg.alt = tile.dataset.cap || '';
        shotCap.innerHTML = (tile.dataset.cap ? '<b>' + tile.dataset.cap + '</b><span>·</span>' : '')
          + '<span>' + (shotIdx + 1) + ' / ' + shotFulls.length + '</span>';
        shotViewer.classList.add('is-open');
        shotViewer.setAttribute('aria-hidden', 'false');
      }
      function shotClose() {
        shotViewer.classList.remove('is-open');
        shotViewer.setAttribute('aria-hidden', 'true');
      }

      shotTiles.forEach(function (tile) {
        tile.addEventListener('click', function () {
          var i = shotFulls.indexOf(tile);
          shotShow(i < 0 ? shotFulls.length - 1 : i);
        });
      });
      var shotPrev = document.getElementById('shotPrev');
      var shotNext = document.getElementById('shotNext');
      if (shotPrev) shotPrev.addEventListener('click', function () { shotShow(shotIdx - 1); });
      if (shotNext) shotNext.addEventListener('click', function () { shotShow(shotIdx + 1); });
      shotViewer.querySelectorAll('[data-shot-close]').forEach(function (el) {
        el.addEventListener('click', shotClose);
      });
      document.addEventListener('keydown', function (e) {
        if (!shotViewer.classList.contains('is-open')) return;
        if (e.key === 'Escape') { e.stopPropagation(); shotClose(); }
        else if (e.key === 'ArrowLeft') shotShow(shotIdx - 1);
        else if (e.key === 'ArrowRight') shotShow(shotIdx + 1);
      });
    }

    /* 第 69 轮：左缘拖拽调宽 —— --ai-w 写在 .cds-frame，右栏与右下悬浮球同步跟着走。
       下限 400（稿面 450 是默认值），上限取 min(720, 面板宽 - 480)，保证主区不至于被挤死 */
    var aiResize = document.getElementById('aiResize');
    var cdsFrame = document.querySelector('.cds-frame');
    var AI_MIN = 400, AI_MAX = 720;
    function aiMaxW() {
      var pw = panelBox ? panelBox.clientWidth : 1440;
      return Math.max(AI_MIN, Math.min(AI_MAX, pw - 480));
    }
    function aiSetW(w) {
      if (!cdsFrame) return;
      w = Math.max(AI_MIN, Math.min(aiMaxW(), Math.round(w)));
      cdsFrame.style.setProperty('--ai-w', w + 'px');
    }
    if (aiResize && cdsFrame && aiSide) {
      var aiDragging = false, aiStartX = 0, aiStartW = 0;
      aiResize.addEventListener('pointerdown', function (e) {
        if (panelBox && panelBox.classList.contains('is-ai-off')) return;
        aiDragging = true;
        aiStartX = e.clientX;
        aiStartW = aiSide.getBoundingClientRect().width;
        aiResize.classList.add('is-drag');
        document.body.classList.add('is-ai-resizing');
        if (aiResize.setPointerCapture) aiResize.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      aiResize.addEventListener('pointermove', function (e) {
        if (!aiDragging) return;
        aiSetW(aiStartW + (aiStartX - e.clientX));
      });
      function aiEndDrag() {
        if (!aiDragging) return;
        aiDragging = false;
        aiResize.classList.remove('is-drag');
        document.body.classList.remove('is-ai-resizing');
      }
      aiResize.addEventListener('pointerup', aiEndDrag);
      aiResize.addEventListener('pointercancel', aiEndDrag);
      /* 键盘可调：← 加宽 / → 收窄，Shift 步进 40 */
      aiResize.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var step = e.shiftKey ? 40 : 16;
        aiSetW(aiSide.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? step : -step));
      });
      /* 窗口变窄时把宽度收回上限内 */
      window.addEventListener('resize', function () {
        if (!cdsFrame.style.getPropertyValue('--ai-w')) return;
        if (panelBox && panelBox.classList.contains('is-ai-off')) return;
        aiSetW(aiSide.getBoundingClientRect().width);
      });
    }

    /* 第 73 轮：目标区三条独立可编辑行 —— 清空后把残留的 <br>/<div> 一并抹掉，
       让 :empty 重新成立、占位符「请输入」回来 */
    document.querySelectorAll('.tp-ta-in').forEach(function (el) {
      el.addEventListener('input', function () {
        if (!el.textContent.trim() && !el.querySelector('img')) el.innerHTML = '';
      });
    });

    /* 底部工序资产页签 */
    var tabsBar = document.querySelector('.task-tabs');
    var tabsL = tabsBar ? tabsBar.querySelector('.tk-tabs-l') : null;
    if (tabsL) {
      tabsL.addEventListener('click', function (e) {
        var x = e.target.closest('.tk-x');
        var tab = e.target.closest('.tk-tab');
        if (!tab) return;
        if (x) {                       /* 关闭：摘掉页签，选中态交给前一个（没有就退到第一个） */
          e.stopPropagation();
          var wasOn = tab.classList.contains('is-on');
          var prev = tab.previousElementSibling;
          tab.remove();
          if (wasOn) {
            var nextOn = (prev && prev.classList.contains('tk-tab')) ? prev : tabsL.querySelector('.tk-tab');
            if (nextOn) { nextOn.classList.add('is-on'); nextOn.setAttribute('aria-selected', 'true'); }
          }
          /* 第 72 轮：关掉文件页签 → 中栏退回变更分析 */
          if (syncDocPane) syncDocPane();
          return;
        }
        tabsL.querySelectorAll('.tk-tab').forEach(function (t) {
          t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-on');
        tab.setAttribute('aria-selected', 'true');
        /* 第 72 轮：亮的是文件页签就看文档，否则回到变更分析 */
        if (syncDocPane) syncDocPane();
      });

      var addBtn = tabsL.querySelector('.tk-icon-btn');
      if (addBtn) addBtn.addEventListener('click', function () { toast('新建工序资产'); });
    }

    /* ---------- 第 37 轮：专注模式（= 全屏）
       进：收左栏 / 右栏（走抽屉自己的宽度弹性），body 加 is-focus →
           task-top 与 task-steps 一并收平，只留 task-tabs 当退出入口
       出：把进来前的左右栏开合状态还原（Esc 也能出） ---------- */
    var focusBtn = document.getElementById('tkFocus');
    var focusWas = null;

    function setFocus(on) {
      if (!focusBtn) return;
      var b = document.body;
      if (on === b.classList.contains('is-focus')) return;
      var rsBtn = document.getElementById('rsToggle');
      if (on) {
        focusWas = {
          ws: !!(drawer && drawer.classList.contains('is-open')),
          rs: !!(rsDrawer && rsDrawer.classList.contains('is-open')),
        };
        if (focusWas.ws) closeDrawer(false);
        if (focusWas.rs && rsBtn) rsBtn.click();
        b.classList.add('is-focus');
      } else {
        b.classList.remove('is-focus');
        if (focusWas && focusWas.ws) openDrawer();
        if (focusWas && focusWas.rs && rsBtn) rsBtn.click();
        focusWas = null;
      }
      focusBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      focusBtn.setAttribute('aria-label', on ? '退出专注模式' : '专注模式');
      focusBtn.setAttribute('data-tip', on ? '退出专注模式' : '专注模式');
      /* 第 47 轮：文字跟着状态走 —— 专注模式 ⇄ 退出专注模式 */
      var ft = focusBtn.querySelector('.tk-focus-txt');
      if (ft) ft.textContent = on ? '退出专注模式' : '专注模式';
      if (!on) requestAnimationFrame(layoutSteps);
    }
    if (focusBtn) {
      focusBtn.addEventListener('click', function () {
        setFocus(!document.body.classList.contains('is-focus'));
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.body.classList.contains('is-focus')) {
          e.stopPropagation();
          setFocus(false);
        }
      });
    }
  }

})();

/* ============================================================
   第 48 轮：任务页大容器里的可折叠块（主体 / 文件输入 / 参考代码源 / 代码源卡）
   标题栏按钮带 data-tp-toggle，点一下切最近一层 .is-open ⇄ .is-closed
   ============================================================ */
(function () {
  var btns = document.querySelectorAll('.tp-wrap [data-tp-toggle]');
  [].forEach.call(btns, function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.tp-body, .tp-files, .tp-ref, .tp-repo');
      if (!box) return;
      var open = box.classList.toggle('is-open');
      box.classList.toggle('is-closed', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();

/* ============================================================
   第 49 轮：① 上传本地资料 → 系统文件选择窗口
              ② 补充 / 更改文字说明 → 480 宽弹窗（多行文本 + 保存关闭）
   ============================================================ */
(function () {
  function tip(msg) {
    var wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    var el = document.createElement('div');
    el.className = 'semi-toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }

  var fileInp = document.getElementById('tpFileInput');
  var pickBtn = document.querySelector('.tp-file-btn[data-file-pick]');
  if (fileInp && pickBtn) {
    pickBtn.addEventListener('click', function () {
      fileInp.value = '';
      fileInp.click();
    });
    fileInp.addEventListener('change', function () {
      var n = fileInp.files ? fileInp.files.length : 0;
      if (n) tip('已添加 ' + n + ' 个本地文件');
      fileInp.value = '';
    });
  }

  var modal = document.getElementById('tpNoteModal');
  if (!modal) return;
  var titleEl = document.getElementById('tpNoteTitle');
  var taEl = document.getElementById('tpNoteText');
  var saveEl = document.getElementById('tpNoteSave');
  var curBtn = null;

  function openNote(btn) {
    curBtn = btn;
    titleEl.textContent = btn.getAttribute('data-tp-note') || '补充文字说明';
    taEl.value = btn.getAttribute('data-note-value') || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { taEl.focus(); });
  }
  function closeNote() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    curBtn = null;
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest ? e.target.closest('[data-tp-note]') : null;
    if (openBtn) { e.preventDefault(); openNote(openBtn); return; }
    if (e.target.closest && e.target.closest('[data-note-close]')) closeNote();
  });

  if (saveEl) {
    saveEl.addEventListener('click', function () {
      if (curBtn) {
        var v = taEl.value;
        curBtn.setAttribute('data-note-value', v);
        var label = v.trim() ? '更改文字说明' : '补充文字说明';
        curBtn.setAttribute('data-tp-note', label);
        curBtn.textContent = label;
      }
      closeNote();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      e.stopPropagation();
      closeNote();
    }
  });
})();

/* ============================================================
   第 76 轮：任务总结工序页
   ① 工序资产逐行折叠 + 右上「全部展开 / 收起」
   ② 底栏「智能派发任务」/ 卡内「打开任务派发」→ 任务智能派发弹窗
   ③ 弹窗：组 ⇄ 子项联动、全选、计数、按工序生成任务卡、派发提示
   ============================================================ */
(function () {
  if (document.body.getAttribute('data-page') !== 'summary') return;

  function tip(msg) {
    var wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    var el = document.createElement('div');
    el.className = 'semi-toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }

  /* ---------- ① 工序资产 ---------- */
  var list = document.getElementById('saList');
  var allBtn = document.getElementById('saAll');

  function rows() { return [].slice.call(list.querySelectorAll('.sa-row')); }
  function syncAllBtn() {
    if (!allBtn) return;
    var all = rows().every(function (r) { return r.classList.contains('is-open'); });
    allBtn.setAttribute('aria-expanded', all ? 'true' : 'false');
  }
  function setRow(row, open) {
    row.classList.toggle('is-open', open);
    var h = row.querySelector('.sa-row-h');
    if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (list) {
    list.addEventListener('click', function (e) {
      var h = e.target.closest ? e.target.closest('.sa-row-h') : null;
      if (!h) return;
      var row = h.closest('.sa-row');
      if (!row) return;
      setRow(row, !row.classList.contains('is-open'));
      syncAllBtn();
    });
    syncAllBtn();
  }
  if (allBtn) {
    allBtn.addEventListener('click', function () {
      var open = allBtn.getAttribute('aria-expanded') !== 'true';
      rows().forEach(function (r) { setRow(r, open); });
      allBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- ② 弹窗开关 ---------- */
  var modal = document.getElementById('dpModal');
  if (!modal) return;
  var dlg = modal.querySelector('.dp-dlg');

  function openDp() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      var first = modal.querySelector('.dp-left-scroll input');
      if (first) { try { first.focus({ preventScroll: true }); } catch (err) {} }
    });
  }
  function closeDp() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    hideToast();
  }
  function hideToast() {
    var t = document.getElementById('dpToast');
    if (t) t.hidden = true;
  }

  ['sumDispatch', 'sumOpenDispatch'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', openDp);
  });
  modal.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-dp-close]')) closeDp();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      e.stopPropagation();
      closeDp();
    }
  });

  /* ---------- ③ 勾选联动 ---------- */
  var countEl = document.getElementById('dpCount');
  var groups = [].slice.call(modal.querySelectorAll('.dp-grp'));

  function itemsOf(g) { return [].slice.call(g.querySelectorAll('[data-dp-item]')); }
  function allOf(g) { return g.querySelector('[data-dp-all]'); }
  function checkedOf(g) {
    var list = itemsOf(g).filter(function (i) { return i.checked; });
    return list.length;
  }
  function refreshCount() {
    var boxes = [].slice.call(modal.querySelectorAll('.dp-left-scroll input[type="checkbox"]'));
    var n = boxes.filter(function (i) { return i.checked; }).length;
    if (countEl) countEl.textContent = '共 ' + boxes.length + ' 项，已选 ' + n + ' 项';
  }
  function syncGroup(g) {
    var all = allOf(g);
    if (!all) return;
    var items = itemsOf(g);
    if (!items.length) return;
    var n = items.filter(function (i) { return i.checked; }).length;
    all.checked = n === items.length;
    all.indeterminate = n > 0 && n < items.length;
  }

  groups.forEach(function (g) {
    var all = allOf(g);
    if (all) {
      all.addEventListener('change', function () {
        itemsOf(g).forEach(function (i) { i.checked = all.checked; });
        render();
      });
    }
    itemsOf(g).forEach(function (i) {
      i.addEventListener('change', function () { syncGroup(g); render(); });
    });
  });

  var allBtn2 = document.getElementById('dpSelectAll');
  if (allBtn2) {
    allBtn2.addEventListener('click', function () {
      var boxes = [].slice.call(modal.querySelectorAll('.dp-left-scroll input[type="checkbox"]'));
      var turnedOn = boxes.filter(function (i) { return i.checked; }).length !== boxes.length;
      boxes.forEach(function (i) { i.checked = turnedOn; });
      groups.forEach(syncGroup);
      render();
    });
  }

  /* ---------- ④ 按工序生成任务卡 ---------- */
  var listEl = document.getElementById('dpList');
  var emptyEl = document.getElementById('dpEmpty');
  var CARD_RULES = [
    {
      key: 'arch', grp: ['design', 'detail', 'program'],
      type: '架构设计', muted: true, owner: '架构师 · 周宁',
      src: '概要设计、详细设计、程序设计',
      goal: '基于已完成的设计资产，补齐架构方案、接口契约与数据设计。',
      assets: ['变动范围分析报告.md · 概要设计', '改动设计要点分析报告.md · 概要设计', '【概要设计】-登录失败提示.md · 概要设计',
               '代码变更规划.md · 详细设计', '登录失败提示_详细设计.md · 详细设计', '程序设计资产清单.yaml · 程序设计']
    },
    {
      key: 'dev', grp: ['code'],
      type: '代码开发', muted: false, owner: '研发经理 · 陈昊',
      src: '代码开发、代码审查',
      goal: '按设计资产落地登录失败提示的错误码映射与文案。',
      assets: []
    },
    {
      key: 'fix', grp: ['defect'],
      type: '缺陷修复', muted: false, warn: true, owner: '测试经理 · 赵小敏',
      src: '白盒测试、提交流水线',
      goal: '按测试结论修复登录失败分支的边界缺陷并回归。',
      assets: []
    }
  ];

  function cardHtml(rule, assetCount) {
    var tags = '<span class="dp-type' + (rule.muted ? ' is-muted' : '') + (rule.warn ? ' is-warn' : '') + '">' + rule.type + '</span>';
    var dv = rule.assets.length
      ? '<div class="dp-dv"><span class="dp-dv-line"></span><span class="dp-dv-t">传递资产 · 已选 ' + rule.assets.length + ' 项</span><span class="dp-dv-line"></span></div>' +
        '<div class="dp-dv-list">' + rule.assets.map(function (a) {
          return '<label class="dp-ck"><input type="checkbox" checked><span class="dp-box"></span>' + a + '</label>';
        }).join('') + '</div>'
      : '';
    return '' +
      '<article class="dp-card" data-key="' + rule.key + '">' +
        '<div class="dp-card-tags">' + tags + '</div>' +
        '<span class="dp-state is-right">待派发</span>' +
        '<div class="dp-card-main">' +
          '<h4 class="dp-card-t">统一登录失败提示</h4>' +
          '<p class="dp-card-s">来源：' + rule.src + ' · ' + assetCount + ' 项资产</p>' +
          '<div class="dp-card-row">' +
            '<span class="dp-sel"><span class="dp-sel-k">选择受理岗位/人员：</span><span class="dp-sel-v">' + rule.owner + '</span>' +
              '<span class="ico ico14"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.8 5.6 7 8.8l3.2-3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' +
            '<div class="dp-card-btns">' +
              '<button class="dp-btn" type="button" data-dp-detail>' + (rule.assets.length ? '收起详情' : '任务详情') + '</button>' +
              '<button class="dp-btn" type="button" data-dp-remove>移除</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="dp-detail"' + (rule.assets.length ? '' : ' hidden') + '>' +
          '<p><span class="dp-detail-k">目标：</span>' + rule.goal + '</p>' +
          '<p><span class="dp-detail-k">背景：</span>来源任务 #1042「统一登录失败提示」。工作空间：数字构建实验室。</p>' +
          dv +
        '</div>' +
      '</article>';
  }

  function render() {
    if (!listEl) return;
    var html = '';
    var shown = 0;
    CARD_RULES.forEach(function (rule) {
      var hit = rule.grp.some(function (k) {
        var g = modal.querySelector('.dp-grp[data-grp="' + k + '"]');
        if (!g) return false;
        return checkedOf(g) > 0 || (allOf(g) && allOf(g).checked);
      });
      if (!hit) return;
      var assets = rule.grp.reduce(function (acc, k) {
        var g = modal.querySelector('.dp-grp[data-grp="' + k + '"]');
        return acc + (g ? checkedOf(g) : 0);
      }, 0);
      html += cardHtml(rule, assets);
      shown++;
    });
    if (emptyEl) emptyEl.remove();
    [].slice.call(listEl.querySelectorAll('.dp-card')).forEach(function (c) { c.remove(); });
    if (shown) listEl.insertAdjacentHTML('beforeend', html);
    else if (!listEl.querySelector('.dp-empty')) {
      listEl.insertAdjacentHTML('beforeend',
        '<div class="dp-empty" id="dpEmpty"><p class="dp-empty-t">还没有派发的任务</p>' +
        '<button class="dp-split" type="button" id="dpSplitAll">一键智能拆分全部工序</button></div>');
      bindSplit();
    }
    refreshCount();
  }

  function bindSplit() {
    var b = document.getElementById('dpSplitAll');
    if (!b) return;
    b.addEventListener('click', function () {
      var boxes = [].slice.call(modal.querySelectorAll('.dp-left-scroll input[type="checkbox"]'));
      boxes.forEach(function (i) { i.checked = true; });
      groups.forEach(syncGroup);
      render();
    });
  }
  bindSplit();
  refreshCount();

  /* 卡内：任务详情 / 收起详情 / 移除 */
  if (listEl) {
    listEl.addEventListener('click', function (e) {
      var d = e.target.closest ? e.target.closest('[data-dp-detail]') : null;
      if (d) {
        var card = d.closest('.dp-card');
        var det = card.querySelector('.dp-detail');
        var open = det.hidden;
        det.hidden = !open;
        d.textContent = open ? '收起详情' : '任务详情';
        return;
      }
      var r = e.target.closest ? e.target.closest('[data-dp-remove]') : null;
      if (r) {
        var c2 = r.closest('.dp-card');
        if (c2) c2.remove();
        if (!listEl.querySelector('.dp-card')) render();
      }
    });
  }

  /* ---------- ⑤ 派发 ---------- */
  var goBtn = document.getElementById('dpGo');
  if (goBtn) {
    goBtn.addEventListener('click', function () {
      var n = listEl ? listEl.querySelectorAll('.dp-card').length : 0;
      if (!n) { tip('请先勾选要派发的工序或资产'); return; }
      var t = document.getElementById('dpToast');
      var txt = document.getElementById('dpToastTxt');
      if (txt) txt.textContent = '已派发 ' + n + ' 项任务，任务已完成';
      if (t) t.hidden = false;
      setTimeout(function () {
        closeDp();
        tip('已派发 ' + n + ' 项任务');
      }, 1400);
    });
  }
})();
