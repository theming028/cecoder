/* ============================================================================
 * AI 软件工厂 · Cecoder 转译参考实现（v2，忠实原型 + 最新设计系统规范）
 * 这是「喂给 AI 生成合规页面」的规范范例：真实组件 + 全部值走 --cds-* token。
 * 规范映射（每条都在本文件可定位）：
 *  - 单一实心主按钮：仅「说出你想做的」theme="solid"；其余 primary 一律 theme="light"（铁律12/规则5）
 *  - 控件默认常规尺寸 32px：不传 size=small/large（规则2）
 *  - 卡片圆角 8px / 卡片标题 14px：.semi-card + overrides §9a（规则1/8）
 *  - 页面标题最大 h6：标题用 h6/16px，无 h5 及以上（规则22）
 *  - 表格行高 36px 含 padding / 表头 12px：overrides §5（规则11/13）
 *  - <strong> 字重 500：overrides §8（规则20）
 *  - Tab 非选中项一级正文色：overrides §9b（规则23）
 *  - 官方图标库：@douyinfe/semi-icons，无 emoji（规则9）
 *  - 禁用态仅 Tooltip：「让 AI 继续」disabled + Tooltip（规则4）
 *  - 代码 Diff 默认字体族 12px：.cds-code 走 --cds-font-family-code(=默认族)/--cds-font-size-code（规则16）
 *  - AI 栏：真实 AIChatDialogue+AIChatInput；默认无头像（overrides §9c，容器内 .semi-avatar 也隐藏）、用户气泡无称呼（§9d）、输入区无顶线（§9e，规则24）
 *    用户气泡浅蓝底黑字：overrides §4；助手标题 12px：overrides §6c
 *  - 工序节点居中 + 连接线：.cds-node/.cds-pconn（规则18）
 *  - 左右两栏可拖拽调宽：.cds-resizer + startDrag（忠实原型 resizer）
 *  - 统一查看器按工序 kind 切换形态：doc/board/api/diff/report/review（忠实原型 STAGES.kind）
 * 数据均为合理假数据；所有交互可点击。配套样式见 page-v2.css。
 * ========================================================================== */
import React, { useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, IconButton, TextArea, Select, Tag, Avatar, Badge, Tabs, Card,
  Typography, Divider, Tooltip, Switch, Table, Toast,
  AIChatDialogue, AIChatInput, chatInputToMessage,
} from '@douyinfe/semi-ui';
// 官方 SVG 图标库（规范：禁 emoji / 自造 svg）
import {
  IconBolt, IconMoon, IconSun, IconPlay, IconLayers, IconCommand, IconUser, IconPlus, IconUserGroup,
  IconSetting, IconText, IconEdit, IconComponent, IconColorPalette, IconCode,
  IconBeaker, IconSend, IconChevronLeft, IconChevronRight, IconChevronDown, IconFile, IconSearch,
  IconHistogram, IconCheckboxTick, IconAlertTriangle,
} from '@douyinfe/semi-icons';

const { Text } = Typography;
const toast = (type, c, m) => Toast.create({ content: c, brief: m, type, duration: 2 });

// ---------- 工序流水线（忠实原型 STAGES / ORDER，8 道工序；kind 决定统一查看器渲染形态）----------
const PIPE = [
  { key:'overview',   name:'概要设计',     plain:'需求梳理', kind:'doc',    icon:<IconText/>,          st:'done',    txt:'已完成' },
  { key:'detail',     name:'详细设计',     plain:'交互细节', kind:'doc',    icon:<IconEdit/>,          st:'done',    txt:'已完成' },
  { key:'program',    name:'程序设计',     plain:'技术方案', kind:'api',    icon:<IconComponent/>,     st:'done',    txt:'已完成' },
  { key:'ui',         name:'UI设计',       plain:'界面设计', kind:'board',  icon:<IconColorPalette/>,  st:'run',     txt:'进行中·需拍板' },
  { key:'diffchange', name:'代码变更分析', plain:'改动评估', kind:'doc',    icon:<IconSearch/>,        st:'idle',    txt:'待开始' },
  { key:'dev',        name:'开发实现',     plain:'编码实现', kind:'diff',   icon:<IconCode/>,          st:'idle',    txt:'待开始' },
  { key:'test',       name:'测试',         plain:'质量验证', kind:'report', icon:<IconBeaker/>,        st:'idle',    txt:'待开始' },
  { key:'delivery',   name:'交付确认',     plain:'验收上线', kind:'review', icon:<IconSend/>,          st:'att',     txt:'排队' },
];

// ---------- 任务列表（忠实原型；emoji 角色改为官方图标）----------
const TASKS = [
  { id:'aurora',  title:'会员订阅体系',     role:'产品经理 · Eddy',  roleIcon:<IconFile/>,     stage:'UI设计进行中',       prio:'高', stages:['done','done','done','now','','','',''] },
  { id:'profile', title:'个人中心改版',     role:'前端 · Leo',       roleIcon:<IconCode/>,     stage:'测试中',             prio:'中', stages:['done','done','done','done','done','att','now',''] },
  { id:'h5',      title:'双十一营销活动 H5',role:'产品 · Mia',       roleIcon:<IconFile/>,     stage:'概要设计',           prio:'低', stages:['now','','','','','','',''] },
  { id:'refund',  title:'退款流程自动化',   role:'后端 · Ken',       roleIcon:<IconComponent/>,stage:'开发实现失败',       prio:'高', stages:['done','done','done','done','','err','',''] },
  { id:'dash',    title:'运营数据看板',     role:'PM · Eddy',        roleIcon:<IconHistogram/>,stage:'待交付确认',         prio:'中', stages:['done','done','done','done','done','done','done','att'] },
];

// ---------- 统一查看器：工序产物（去掉 emoji，纯文本 + 类型/状态 tag）----------
const ART = [
  { key:'1', name:'界面设计画板', kind:'board',  status:'已生成' },
  { key:'2', name:'会员订阅页',   kind:'page',   status:'已生成' },
  { key:'3', name:'支付确认',     kind:'page',   status:'待生成' },
  { key:'4', name:'订阅成功',     kind:'page',   status:'待生成' },
];
const artCols = [
  { title:'产物', dataIndex:'name', render:(v)=>(<span className="cds-filelink" onClick={()=>toast('info','查看产物',v)}>{v}</span>) },
  { title:'类型', dataIndex:'kind', width:110, render:(v)=>(<Tag size="small" color="grey">{v}</Tag>) },
  { title:'状态', dataIndex:'status', width:100, render:(v)=>(<Tag size="small" color={v==='已生成'?'green':'grey'}>{v}</Tag>) },
];

// ---------- 统一查看器：按工序 kind 渲染不同形态（忠实原型 STAGES.kind）----------
const BOARD = [
  { key:'A', name:'方案 A · 卡片式', desc:'三档套餐并列，主推居中放大', pick:true },
  { key:'B', name:'方案 B · 列表式', desc:'纵向权益清单 + 侧栏价格', pick:false },
  { key:'C', name:'方案 C · 对比表', desc:'功能矩阵对比，突出差异项', pick:false },
];
const API_ROWS = [
  { key:'1', method:'POST', path:'/v1/subscription/order', desc:'创建订阅订单' },
  { key:'2', method:'GET',  path:'/v1/subscription/plan',   desc:'拉取套餐与权益' },
  { key:'3', method:'PUT',  path:'/v1/subscription/renew',  desc:'续费 / 自动续订' },
];
const apiCols = [
  { title:'方法', dataIndex:'method', width:90, render:(v)=>(<Tag size="small" color={v==='POST'?'blue':v==='PUT'?'orange':'green'}>{v}</Tag>) },
  { title:'接口', dataIndex:'path', render:(v)=>(<span className="cds-filelink" onClick={()=>toast('info','接口',v)}>{v}</span>) },
  { title:'说明', dataIndex:'desc' },
];
const REPORT_KPI = [['用例总数','22',''],['通过','20','',false],['失败','2','',true],['覆盖率','86%','+3%',false]];
const CASE_ROWS = [
  { key:'1', name:'年付立减 20% 计价', result:'pass' },
  { key:'2', name:'自动续订扣费失败重试', result:'fail' },
  { key:'3', name:'续费失败宽限期', result:'fail' },
];
const caseCols = [
  { title:'用例', dataIndex:'name' },
  { title:'结果', dataIndex:'result', width:100, render:(v)=>(<Tag size="small" color={v==='pass'?'green':'red'}>{v==='pass'?'通过':'失败'}</Tag>) },
];
const REVIEW_ITEMS = [
  { key:'1', name:'需求基线冻结', done:true },
  { key:'2', name:'交互与视觉拍板', done:true },
  { key:'3', name:'代码审查通过', done:false },
  { key:'4', name:'测试用例回归', done:false },
  { key:'5', name:'资产归档与血缘核对', done:false },
];

// 统一查看器主体：按 kind 切换真实组件形态
function ViewerBody({ p }){
  if(p.kind==='doc') return (<>
    <Text>基于「概要设计」的目标人群与「详细设计」的字段状态，产出 </Text>
    <Text strong>3 套视觉</Text><Text> 供拍板；不重新发明，复用既有组件契约。</Text>
    <div style={{height:12}}/>
    <Table columns={artCols} dataSource={ART} pagination={false}
      onRow={(r)=>({onClick:()=>toast('info',r.name,'查看该产物详情')})}/>
  </>);
  if(p.kind==='board') return (
    <div className="cds-board-grid">{BOARD.map(b=>(
      <div key={b.key} className={'cds-board-card'+(b.pick?' pick':'')} onClick={()=>toast('info','选择视觉方案',b.name)}>
        <div className="cds-board-card-hd"><Text strong>{b.name}</Text>{b.pick&&<Tag size="small" color="blue">推荐</Tag>}</div>
        <Text tertiary size="small">{b.desc}</Text>
        <Button size="small" theme="light" type="primary" onClick={(e)=>{e.stopPropagation();toast('success','已拍板',b.name);}}>拍板此方案</Button>
      </div>))}</div>);
  if(p.kind==='api') return (
    <Table columns={apiCols} dataSource={API_ROWS} pagination={false}/>);
  if(p.kind==='diff') return (
    <div className="cds-code">
      <div className="dl ctx">@@ -24,7 +24,11 @@ public class LoginErrorHandler {'{'}</div>
      <div className="dl del">-    return Response.error(e.getMessage());</div>
      <div className="dl add">+    String code = ErrorCodeMapper.map(e);</div>
      <div className="dl add">+    return Response.error(code, MessageBundle.text(code));</div>
    </div>);
  if(p.kind==='report') return (<>
    <div className="cds-kpi-row">{REPORT_KPI.map((k,i)=>(
      <div key={i} className={'cds-kpi'+(k[3]?' risk':'')}><span className="cds-kpi-label">{k[0]}</span><span className="cds-kpi-value">{k[1]}</span><span className="cds-kpi-note">{k[2]}</span></div>))}</div>
    <div style={{height:12}}/>
    <Table columns={caseCols} dataSource={CASE_ROWS} pagination={false}
      onRow={(r)=>({onClick:()=>toast('info','用例',r.name)})}/>
  </>);
  // review
  return (
    <div className="cds-checklist">{REVIEW_ITEMS.map(it=>(
      <div key={it.key} className={'cds-check-item'+(it.done?' done':'')} onClick={()=>toast('info','交付确认',it.name)}>
        <span className="cds-check-ic">{it.done?<IconCheckboxTick/>:<IconAlertTriangle/>}</span>
        <Text>{it.name}</Text>
      </div>))}</div>);
}

const AI_ROLE_CONFIG = { user:{ name:'你' }, assistant:{ name:'Copilot' }, system:{ name:'系统' } };

function App(){
  const [task,setTask]=useState('aurora');
  const [leftTab,setLeftTab]=useState('mine');
  const [midTab,setMidTab]=useState('pipe');
  const [node,setNode]=useState('ui');
  const [role,setRole]=useState('pm');
  const [dark,setDark]=useState(false);
  const [autoRun,setAutoRun]=useState(true);
  const [generating,setGenerating]=useState(false);
  const [leftCollapsed,setLeftCollapsed]=useState(false);
  const [rightCollapsed,setRightCollapsed]=useState(false);

  // 可拖拽列宽（忠实原型 rz-left / rz-right；保持默认宽度）
  const [leftW,setLeftW]=useState(300);
  const [rightW,setRightW]=useState(380);
  const dragRef=useRef(null);
  const startDrag=useCallback((side,e)=>{
    e.preventDefault(); dragRef.current=side;
    const sx=e.clientX, sl=leftW, sr=rightW;
    const move=(ev)=>{ const dx=ev.clientX-sx;
      if(dragRef.current==='left') setLeftW(Math.min(460,Math.max(240,sl+dx)));
      else if(dragRef.current==='right') setRightW(Math.min(560,Math.max(300,sr-dx))); };
    const up=()=>{ dragRef.current=null; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); document.body.style.userSelect=''; };
    document.body.style.userSelect='none'; document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
  },[leftW,rightW]);

  const [chats,setChats]=useState([
    { id:'m1', role:'assistant', status:'completed', content:'已排好 8 道工序并分配岗位。UI 设计阶段产出 3 套视觉，需你拍板后再进入开发。' },
    { id:'m2', role:'user', content:'加一条：年付立减 20%，并自动续订。' },
    { id:'m3', role:'assistant', status:'completed', content:'已写入「详细设计」并同步到方案 A。但「续费失败宽限期」上游未定义——正是中栏「AI 没把握」那张卡片。' },
  ]);

  const toggleTheme=()=>{ const d=!dark; setDark(d); d?document.body.setAttribute('theme-mode','dark'):document.body.removeAttribute('theme-mode'); };
  const pushAI=(text)=>setChats(c=>[...c,{ id:'a'+Date.now(), role:'assistant', status:'completed', content:text }]);
  const onMessageSend=(props)=>{ setGenerating(true); setChats(c=>[...c,chatInputToMessage(props)]); setTimeout(()=>setGenerating(false),400); setTimeout(()=>pushAI('收到，我会把这条更新路由到对应工序并继续推进。'),900); };
  const say=(t)=>{ setChats(c=>[...c,{ id:'u'+Date.now(), role:'user', content:t }]); setTimeout(()=>pushAI('收到，我会把这条更新路由到对应工序并继续推进。'),500); };

  const curTask=TASKS.find(x=>x.id===task);

  return (
    <div className="cds-app">
      {/* ===== Topbar ===== */}
      <header className="semi-layout-header cds-topbar">
        <div className="cds-brand"><span className="logo"><IconBolt/></span> AI 软件工厂 <small>v2 · AI-Native</small></div>
        <Divider layout="vertical"/>
        <Select className="cds-workdir" style={{width:180}} value="~/dev/ai-factory" onChange={(v)=>toast('info','工作目录','切换到 '+v)}
          optionList={[{value:'~/dev/ai-factory',label:'~/dev/ai-factory'},{value:'~/dev/pay-hub',label:'~/dev/pay-hub'},{value:'~/dev/data-ops',label:'~/dev/data-ops'}]}/>
        <Tag color="green" size="small">已连接</Tag>
        <Tooltip content="以某岗位身份代跑：该岗位工序即由你来做，数字分身随之变为 TA 的分身">
          <Select style={{width:150}} value={role} onChange={setRole} optionList={[
            {value:'pm',label:'项目经理 · 全局'},{value:'product',label:'产品经理'},{value:'design',label:'UI设计师'},
            {value:'backend',label:'后端工程师'},{value:'frontend',label:'前端工程师'},{value:'test',label:'测试工程师'}]}/>
        </Tooltip>
        <div className="cds-spacer"/>
        <Tag color="purple" size="small">● 串讲中</Tag>
        <Switch checkedText="深" uncheckedText="浅" checked={dark} onChange={toggleTheme}/>
        <Button theme="light" type="primary" icon={<IconPlay/>} onClick={()=>toast('info','演示串讲','开始自动串讲新范式')}>演示串讲</Button>
        <Tooltip content="组织全景看板 · 全部任务泳道 + 统计"><Badge count={3}><IconButton icon={<IconLayers/>} theme="borderless" type="tertiary" onClick={()=>toast('info','全景看板','打开全部任务泳道')}/></Badge></Tooltip>
        <Tooltip content="命令面板 ⌘K"><IconButton icon={<IconCommand/>} theme="borderless" type="tertiary" onClick={()=>toast('info','命令面板','Ctrl/⌘ + K')}/></Tooltip>
        <Button theme="light" type="primary" icon={<IconUser/>} onClick={()=>toast('info','数字分身','打开你的个人代理')}>数字分身</Button>
      </header>

      {/* ===== Main（三栏 + 可拖拽 resizer + 折叠 rail，忠实原型）===== */}
      <div className="cds-main">
        {leftCollapsed ? (
          <div className="cds-rail"><IconButton theme="borderless" type="tertiary" icon={<IconChevronRight/>} aria-label="展开任务栏" onClick={()=>setLeftCollapsed(false)}/></div>
        ) : (
          <aside className="cds-col" id="col-left" style={{width:leftW}}>
            <div className="cds-col-head">
              <Tabs type="button" activeKey={leftTab} onChange={setLeftTab}
                tabList={[{tab:'我的需求',itemKey:'mine'},{tab:'待我处理',itemKey:'assigned'}]}/>
              <div className="cds-spacer"/>
              <IconButton size="small" theme="borderless" type="tertiary" icon={<IconChevronLeft/>} aria-label="折叠" onClick={()=>setLeftCollapsed(true)}/>
            </div>
            <div className="cds-list-actions">
              {/* 全页唯一实心主按钮 */}
              <Button block theme="solid" type="primary" icon={<IconPlus/>} onClick={()=>toast('info','新建需求','说出你想做的，AI 帮你跑')}>说出你想做的（AI 帮你跑）</Button>
            </div>
            <div className="cds-task-list">
              {TASKS.map(t=>(
                <div key={t.id} className={'semi-card cds-task'+(task===t.id?' sel':'')+(t.stages.includes('err')?' is-error':'')}
                     onClick={()=>{setTask(t.id);toast('info',t.title,'已选中：'+t.stage);}}>
                  <div className="cds-task-top">
                    <div className="cds-task-title">{t.title}</div>
                    <Tag size="small" color={t.prio==='高'?'red':t.prio==='中'?'orange':'grey'}>{t.prio}</Tag>
                    {t.stages.includes('now')&&<Tag size="small" color="light-blue">进行中</Tag>}
                  </div>
                  <div className="cds-task-meta">{t.roleIcon}<span>{t.role} · {t.stage}</span></div>
                  <div className="cds-stages">{t.stages.map((s,i)=><span key={i} className={'s '+s}/>)}</div>
                </div>))}
            </div>
          </aside>)}

        {!leftCollapsed && <div className="cds-resizer" onMouseDown={(e)=>startDrag('left',e)} title="拖动调整宽度"/>}

        {/* ===== Mid ===== */}
        <main className="cds-col" id="col-mid">
          <header className="semi-layout-header cds-mid-head">
            <div><div className="cds-mid-title">{curTask.title}</div><div className="cds-mid-sub">8 道工序 · AI 自动排程</div></div>
            <div className="cds-spacer"/>
            <Tabs type="card" activeKey={midTab} onChange={setMidTab}
              tabList={[{tab:'流水线',itemKey:'pipe'},{tab:'工序产物',itemKey:'art'},{tab:'代码 diff',itemKey:'diff'},{tab:'审计',itemKey:'audit'}]}/>
          </header>

          <div className="cds-mid-body">
            {/* 工序流水线：节点居中 + 连接线（规范） */}
            <div className="cds-pipe">
              {PIPE.map((p,i)=>(
                <React.Fragment key={p.key}>
                  <div className={'cds-node '+p.st+(node===p.key?' focus':'')}
                       onClick={()=>{setNode(p.key);toast('info',p.name,'查看工序：'+p.txt);}}>
                    <span className="cds-node-ic">{p.st==='done'?<IconCheckboxTick/>:p.st==='att'?<IconAlertTriangle/>:p.icon}</span>
                    <span className="cds-node-name">{p.name}</span>
                    <span className={'cds-node-status st-'+p.st}><span className="d"/>{p.txt}</span>
                  </div>
                  {i<PIPE.length-1 && <span className="cds-pconn"/>}
                </React.Fragment>))}
            </div>

            {/* 统一查看器：按选中工序的 kind 渲染（doc/board/api/diff/report/review） */}
            {midTab==='pipe' && (()=>{ const p=PIPE.find(x=>x.key===node); return (
              <div className="semi-card cds-viewer">
                <div className="cds-vd-hd">{p.name} · Aurora 商务 <Tag size="small" color="grey" style={{marginLeft:'auto'}}>{p.kind}</Tag></div>
                <div className="cds-vd-body"><ViewerBody p={p}/></div>
              </div>); })()}
            {midTab==='art' && (
              <div className="semi-card cds-viewer"><div className="cds-vd-hd">工序产物</div>
                <div className="cds-vd-body"><Table columns={artCols} dataSource={ART} pagination={false}/></div></div>)}
            {midTab==='diff' && (
              <div className="semi-card cds-viewer"><div className="cds-vd-hd">代码 diff · LoginErrorHandler.java</div>
                <div className="cds-vd-body"><div className="cds-code">
                  <div className="dl ctx">@@ -24,7 +24,11 @@ public class LoginErrorHandler {'{'}</div>
                  <div className="dl del">-    return Response.error(e.getMessage());</div>
                  <div className="dl add">+    String code = ErrorCodeMapper.map(e);</div>
                  <div className="dl add">+    return Response.error(code, MessageBundle.text(code));</div>
                </div></div></div>)}
            {midTab==='audit' && (
              <div className="semi-card cds-viewer"><div className="cds-vd-hd">审计</div>
                <div className="cds-vd-body"><Text tertiary>本任务的工序流转、会签与交付记录将在此沉淀（接入真实审计后展示）。</Text></div></div>)}
          </div>

          {/* mid-foot：自动驾驶 + 让 AI 继续（禁用示例仅 Tooltip） */}
          <footer className="cds-mid-foot">
            <span className="cds-autorun"><Switch checked={autoRun} onChange={(v)=>{setAutoRun(v);toast('info','自动驾驶',v?'已开启：AI 将自动推进工序':'已暂停');}}/><Text style={{marginLeft:8}}>自动驾驶</Text></span>
            <div className="cds-spacer"/>
            <span className="cds-hint">AI 对「续费失败宽限期」上游未定义没把握</span>
            <Tooltip content="上游「续费失败宽限期」未定义，需先补充需求基线后才能继续推进">
              <span><Button theme="light" type="primary" icon={<IconPlay/>} disabled>让 AI 继续</Button></span>
            </Tooltip>
          </footer>
        </main>

        <div className="cds-resizer" onMouseDown={(e)=>startDrag('right',e)} title="拖动调整宽度"/>

        {/* ===== Right Copilot（真实 AIChatDialogue / AIChatInput）===== */}
        {rightCollapsed ? (
          <div className="cds-rail right"><IconButton theme="borderless" type="tertiary" icon={<IconChevronLeft/>} aria-label="展开 Copilot" onClick={()=>setRightCollapsed(false)}/></div>
        ) : (
          <aside className="cds-col" id="col-right" style={{width:rightW}}>
            <header className="semi-layout-header cds-ai-head">
              <Avatar size="small" color="light-blue"><IconUserGroup/></Avatar>
              <div><div className="nm">工厂 Copilot</div><div className="st">在线 · 万能插话入口</div></div>
              <div className="cds-ai-scope">范围：{curTask.title}</div>
              <IconButton size="small" theme="borderless" type="tertiary" icon={<IconChevronRight/>} aria-label="收起" onClick={()=>setRightCollapsed(true)}/>
            </header>
            <div className="cds-ai-msgs">
              <AIChatDialogue align="leftRight" mode="bubble" showAvatar={false} chats={chats} onChatsChange={setChats}
                roleConfig={AI_ROLE_CONFIG}
                hints={['查看概要设计','改派 UI 给设计师','直接跑开发']} onHintClick={(h)=>say(h)} showReset={false}/>
            </div>
            <div className="cds-ai-input">
              <AIChatInput placeholder="随时说，AI 会路由到相应工序…（可指认 / 按住说话）"
                generating={generating} onMessageSend={onMessageSend} onStopGenerate={()=>setGenerating(false)}/>
            </div>
          </aside>)}
      </div>
    </div>);
}

createRoot(document.getElementById('root')).render(<App/>);
