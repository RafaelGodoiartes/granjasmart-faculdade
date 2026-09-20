/* GranjaSmart Acadêmica — dados ficam somente no navegador deste aparelho. */
const STORAGE_KEY = 'granjasmart-academica-v1';
const COLLECTIONS = ['farms','houses','flocks','mortality','feed','weights','vaccines','expenses','revenues','sales','inventory','tasks','formulas','vetNotes'];
const fresh = () => Object.fromEntries(COLLECTIONS.map((key) => [key, []]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const brl = (value) => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(Number(value) || 0);
const qty = (value, digits = 0) => new Intl.NumberFormat('pt-BR', {maximumFractionDigits:digits}).format(Number(value) || 0);
const dateBR = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const days = (value) => value ? Math.max(0, Math.floor((new Date(`${today()}T12:00:00`) - new Date(`${value}T12:00:00`)) / 86400000)) : 0;
const sum = (list, key) => list.reduce((total, item) => total + Number(item[key] || 0), 0);
let db = load();
let ui = { page: (location.hash || '#painel').slice(1), form: '', query: '', menu: false, prefillFlockId: '', formulaPhase: 'Todas', mixFormulaId: '', mixKg: 100, mixStep: 0, selectedSymptoms: [], calendarMonth: today().slice(0,7), calendarDay: today() };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return { ...fresh(), ...Object.fromEntries(COLLECTIONS.map((key) => [key, Array.isArray(saved[key]) ? saved[key] : []])), selectedFarm: saved.selectedFarm || '' };
  } catch (_) { /* dados indisponíveis: mantemos o app utilizável */ }
  return { ...fresh(), selectedFarm: '' };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); return true; }
  catch (_) { toast('Não foi possível salvar neste navegador. Exporte um backup antes de sair.', true); return false; }
}
function toast(message, error = false) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message;
  document.body.append(el); setTimeout(() => el.remove(), 4500);
}
function farm() { return db.farms.find((item) => item.id === db.selectedFarm) || null; }
function scoped(collection) { return db[collection].filter((item) => item.farmId === db.selectedFarm); }
function flock(idValue) { return db.flocks.find((item) => item.id === idValue); }
function flockName(idValue) { return flock(idValue)?.name || 'Lote removido'; }
function currentBirds(item) { return Math.max(0, Number(item.initial) - sum(db.mortality.filter((r) => r.flockId === item.id), 'count') - sum(db.sales.filter((r) => r.flockId === item.id), 'quantity')); }
function activeFlocks() { return scoped('flocks').filter((item) => item.status === 'ativo'); }
function totals() {
  const current = scoped('flocks').reduce((total, item) => total + currentBirds(item), 0);
  const expense = sum(scoped('expenses'), 'amount');
  const sales = scoped('sales').reduce((total, item) => total + Math.max(0, Number(item.quantity) * Number(item.price) - Number(item.discount || 0)), 0);
  const revenue = sum(scoped('revenues'), 'amount') + sales;
  return { current, expense, revenue, profit: revenue - expense, mortality: sum(scoped('mortality'), 'count'), feed: sum(scoped('feed'), 'kg'), sales };
}
function alerts() {
  const out = [];
  for (const item of scoped('vaccines')) {
    const ahead = Math.ceil((new Date(`${item.date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
    if (!item.done && ahead <= 7) out.push({ icon:'💉', title: ahead < 0 ? 'Vacinação atrasada' : ahead === 0 ? 'Vacinação hoje' : `Vacinação em ${ahead} dias`, detail:`${item.name} · ${flockName(item.flockId)}`, level:ahead < 0 ? 'red':'amber' });
  }
  for (const item of scoped('inventory')) {
    if (Number(item.quantity) <= Number(item.minimum)) out.push({icon:'📦',title:'Estoque baixo',detail:`${item.name}: ${qty(item.quantity,2)} ${item.unit}`,level:'amber'});
    if (item.expiry && item.expiry < today()) out.push({icon:'⏱️',title:'Produto vencido',detail:item.name,level:'red'});
  }
  for (const item of scoped('tasks')) if (!item.done && item.date <= today()) out.push({icon:'📅',title:item.date < today() ? 'Tarefa atrasada':'Tarefa hoje',detail:item.title,level:item.date < today() ? 'red':'amber'});
  return out;
}
const navigation = [
  ['painel','◫','Painel'],['lotes','🐔','Lotes'],['alimentacao','🌽','Alimentação'],['mistura','⚖️','Mistura de ração'],['sanidade','💉','Sanidade'],
  ['saude','🩺','Guia de saúde'],['orientacoes','📋','Orientações'],['financeiro','💰','Financeiro'],['estoque','📦','Estoque'],['relatorios','▥','Relatórios'],['configuracoes','⚙','Configurações']
];
function navHTML() { return navigation.map(([key,icon,label]) => `<button class="nav-link${ui.page===key?' active':''}" data-page="${key}"><span>${icon}</span><span>${label}</span>${key==='sanidade'&&alerts().length?`<b class="badge-number">${alerts().length}</b>`:''}</button>`).join(''); }
function layout(content) {
  const pageTitle = navigation.find(([key]) => key === ui.page)?.[2] || 'Painel';
  const online = navigator.onLine;
  document.querySelector('#app').innerHTML = `<div class="app-shell"><div class="screen-overlay${ui.menu?' open':''}" data-action="close-menu"></div>
    <aside class="sidebar${ui.menu?' open':''}"><div class="brand"><img src="./brand-mark.png" alt="Símbolo da GranjaSmart"><div><strong>GranjaSmart</strong></div></div>
    <div class="nav-group">OPERAÇÃO</div>${navHTML()}<div class="sidebar-foot">📱 Dados guardados neste navegador.<br>Faça backup regularmente.</div></aside>
    <div class="main"><header class="topbar"><div class="topbar-left"><button class="menu-toggle" data-action="menu" aria-label="Abrir menu">☰</button><span class="topbar-title">${esc(pageTitle)}</span></div>
      <div class="status-line"><span class="status-dot${online?'':' offline'}"></span><span class="muted">${online?'Online':'Offline'}</span><span class="topbar-badge">Sem login</span></div></header>
      <main class="content">${content}</main></div>
    <nav class="mobile-nav" aria-label="Menu rápido">${[['painel','◫','Painel'],['lotes','🐔','Lotes'],['mistura','⚖️','Mistura'],['saude','🩺','Saúde'],['configuracoes','⚙','Mais']].map(([key,icon,label])=>`<button data-page="${key}" class="${ui.page===key?'active':''}"><span>${icon}</span>${label}</button>`).join('')}</nav></div>`;
}
function head(eyebrow,title,subtitle,actions='') { return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div><div class="head-actions">${actions}</div></div>`; }
function button(label,key,secondary=false) { return `<button class="button${secondary?' secondary':''}" data-new="${key}">${label}</button>`; }
function card(title,content) { return `<section class="card"><div class="section-header"><h2>${title}</h2></div>${content}</section>`; }
function kpi(icon,label,value,note='') { return `<div class="kpi"><span class="icon">${icon}</span><div class="label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`; }
function empty(text='Ainda não há registros.') { return `<div class="empty"><span class="empty-icon">🌱</span><strong>Comece por aqui</strong>${esc(text)}</div>`; }
function table(headers,rows,emptyText) { return rows.length ? `<div class="table-wrap"><table class="table"><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empty(emptyText); }
function del(collection,item) { return `<button class="button small danger" data-delete="${collection}" data-id="${esc(item.id)}" aria-label="Excluir registro">Excluir</button>`; }
function farmWarning() { return farm() ? '' : `<div class="notice warning"><strong>Primeiro passo:</strong> cadastre sua propriedade em Configurações. Depois os registros ficarão organizados por propriedade. <button class="button small secondary" data-page="configuracoes">Cadastrar propriedade</button></div>`; }

function dashboard() {
  const t = totals(), list = activeFlocks(), a = alerts();
  const next = scoped('tasks').filter((item)=>!item.done).sort((x,y)=>x.date.localeCompare(y.date)).slice(0,5);
  const months = Array.from({length:6},(_,i)=>{const d=new Date(); d.setDate(1);d.setMonth(d.getMonth()-5+i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`});
  const chart = months.map((month)=>({month,expense:sum(scoped('expenses').filter((item)=>item.date?.startsWith(month)),'amount'),revenue:sum(scoped('revenues').filter((item)=>item.date?.startsWith(month)),'amount')+scoped('sales').filter((item)=>item.date?.startsWith(month)).reduce((s,item)=>s+Number(item.quantity)*Number(item.price)-Number(item.discount||0),0)}));
  const top = Math.max(1,...chart.flatMap((item)=>[item.expense,item.revenue]));
  layout(head('VISÃO GERAL',`Olá! ${farm()?.name || 'Bem-vindo à GranjaSmart'}`,'Acompanhe sua criação em poucos minutos.',button('＋ Novo lote','flock'))
    + `<div class="notice"><strong>Projeto acadêmico.</strong> Os dados deste aplicativo ficam somente neste navegador, não são enviados a um servidor. Use Exportar backup para não perdê-los.</div>${farmWarning()}`
    + `<div class="grid kpis">${kpi('🐔','Aves atuais',qty(t.current),'Alojadas menos saídas')}${kpi('🏠','Lotes ativos',qty(list.length),'Em produção')}${kpi('☠️','Mortalidade',qty(t.mortality),'Registros acumulados')}${kpi('🌽','Ração consumida',`${qty(t.feed,1)} kg`,'Distribuída aos lotes')}${kpi('💸','Despesas',brl(t.expense),'Total registrado')}${kpi('💵','Receitas',brl(t.revenue),'Inclui vendas')}${kpi('📈','Resultado',brl(t.profit),'Receitas − despesas')}${kpi('⚠️','Alertas',qty(a.length),'Pendências e atenção')}</div>`
    + `<div class="grid two-col">${card('Despesas x receitas · 6 meses',`<div class="bars">${chart.map((item)=>`<div class="bar-col"><div style="display:flex;align-items:end;gap:3px;height:100%;width:100%;justify-content:center"><div class="bar gold" title="Despesas ${brl(item.expense)}" style="height:${Math.max(2,item.expense/top*100)}%"></div><div class="bar" title="Receitas ${brl(item.revenue)}" style="height:${Math.max(2,item.revenue/top*100)}%"></div></div><span class="bar-label">${esc(new Date(item.month+'-02').toLocaleDateString('pt-BR',{month:'short'}))}</span></div>`).join('')}</div><div class="legend"><span><i class="dot gold"></i>Despesas</span><span><i class="dot"></i>Receitas</span></div>`)}
      ${card('Ações rápidas',`<div class="quick-actions">${button('🐔 Novo lote','flock')}${button('☠️ Mortalidade','mortality',true)}${button('🌽 Ração','feed',true)}${button('💰 Despesa','expense',true)}${button('💉 Vacina','vaccine',true)}${button('📅 Tarefa','task',true)}</div><div class="divider"></div><h3>Próximas tarefas</h3>${next.length?next.map((item)=>`<div class="summary-row"><span>${esc(item.title)}</span><strong>${dateBR(item.date)}</strong></div>`).join(''):empty('Nenhuma tarefa pendente.')}`)}</div>`
    + `<div class="grid two-col" style="margin-top:1rem">${card('Lotes em produção',table(['Lote','Idade','Aves','Mortalidade'],list.map((item)=>`<tr><td><strong>${esc(item.name)}</strong></td><td>${days(item.date)} dias</td><td>${qty(currentBirds(item))}</td><td>${qty(sum(db.mortality.filter((r)=>r.flockId===item.id),'count'))}</td></tr>`),'Cadastre o primeiro lote para acompanhar a criação.'))}${card('Alertas',a.length?`<div class="alert-list">${a.slice(0,6).map((item)=>`<div class="alert-item"><span>${item.icon}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div></div>`).join('')}</div>`:empty('Tudo em dia por enquanto.'))}</div>`);
}

const schemas = {
  farm:{collection:'farms',title:'Nova propriedade',fields:[['name','Nome da propriedade','text',true],['city','Cidade','text'],['state','Estado','text']]},
  house:{collection:'houses',title:'Novo galpão',fields:[['name','Nome do galpão','text',true],['capacity','Capacidade de aves','number',true,1],['area','Área (m²)','number',false,0]]},
  flock:{collection:'flocks',title:'Novo lote',fields:[['name','Nome/código do lote','text',true],['purpose','Finalidade','select',true,0,['Corte','Postura','Reprodução','Caipira']],['breed','Raça ou linhagem','text'],['initial','Quantidade inicial','number',true,1],['date','Data de entrada','date',true],['houseId','Galpão','houses'],['status','Status','select',true,0,['ativo','encerrado']]]},
  mortality:{collection:'mortality',title:'Registrar mortalidade',fields:[['flockId','Lote','flocks',true],['date','Data','date',true],['count','Aves mortas','number',true,1],['note','Observação','textarea']]},
  feed:{collection:'feed',title:'Registrar alimentação',fields:[['flockId','Lote','flocks',true],['date','Data','date',true],['type','Tipo de ração','text',true],['kg','Quantidade (kg)','number',true,0.001],['cost','Custo total (R$)','number',false,0]]},
  weight:{collection:'weights',title:'Nova pesagem',fields:[['flockId','Lote','flocks',true],['date','Data','date',true],['kg','Peso médio por ave (kg)','number',true,0.001]]},
  vaccine:{collection:'vaccines',title:'Programar vacinação',fields:[['flockId','Lote','flocks',true],['name','Vacina','text',true],['date','Data prevista','date',true],['responsible','Responsável','text']]},
  expense:{collection:'expenses',title:'Nova despesa',fields:[['description','Descrição','text',true],['category','Categoria','select',true,0,['Ração','Pintinhos','Vacinas','Medicamentos','Mão de obra','Energia','Água','Manutenção','Transporte','Outros']],['flockId','Lote (opcional)','flocks'],['amount','Valor (R$)','number',true,0.01],['date','Data','date',true]]},
  revenue:{collection:'revenues',title:'Nova receita',fields:[['description','Descrição','text',true],['category','Origem','select',true,0,['Ovos','Esterco','Serviço','Outros']],['flockId','Lote (opcional)','flocks'],['amount','Valor (R$)','number',true,0.01],['date','Data','date',true]]},
  sale:{collection:'sales',title:'Nova venda de aves',fields:[['flockId','Lote','flocks',true],['customer','Cliente','text',true],['quantity','Aves vendidas','number',true,1],['price','Preço por ave (R$)','number',true,0],['discount','Desconto total (R$)','number',false,0],['date','Data','date',true]]},
  inventory:{collection:'inventory',title:'Novo item de estoque',fields:[['name','Produto','text',true],['category','Categoria','select',true,0,['Ração','Ingrediente','Vacina','Medicamento','Material','Outro']],['quantity','Quantidade','number',true,0],['unit','Unidade','select',true,0,['kg','un','L','dose','saco']],['minimum','Estoque mínimo','number',true,0],['expiry','Validade','date']]},
  task:{collection:'tasks',title:'Nova tarefa',fields:[['title','Atividade','text',true],['flockId','Lote (opcional)','flocks'],['date','Data prevista','date',true],['note','Observação','textarea']]}
};
function fieldHTML(field) {
  const [name,label,type,required,min,options] = field;
  const base = `name="${name}" id="f-${name}" ${required?'required':''}`;
  let control = '';
  if (type === 'textarea') control = `<textarea ${base} placeholder="Opcional"></textarea>`;
  else if (type === 'select' || type === 'flocks' || type === 'houses') {
    const items = type === 'select' ? options.map((v)=>({id:v,name:v})) : type === 'flocks' ? scoped('flocks').map((v)=>({id:v.id,name:v.name})) : scoped('houses').map((v)=>({id:v.id,name:v.name}));
    control = `<select ${base}><option value="">${required?'Selecione':'Nenhum'}</option>${items.map((item)=>`<option value="${esc(item.id)}"${name==='flockId'&&item.id===ui.prefillFlockId?' selected':''}>${esc(item.name)}</option>`).join('')}</select>`;
  } else control = `<input ${base} type="${type}" ${type==='number'?`min="${min??0}" step="${Number.isInteger(min)&&min>=1?'1':'0.001'}"`:''} ${type==='date'?`value="${today()}"`:''} ${name==='count'&&ui.form==='mortality'?`value="1"`:''}>`;
  return `<div class="field${type==='textarea'?' wide':''}"><label for="f-${name}">${esc(label)}${required?' *':''}</label>${control}</div>`;
}
function formHTML(key) {
  const schema = schemas[key]; if (!schema || ui.form !== key) return '';
  return `<section class="card form-card"><h2>${esc(schema.title)}</h2><form data-form="${key}"><div class="form-grid">${schema.fields.map(fieldHTML).join('')}</div><div class="form-actions"><button type="button" class="button secondary" data-action="cancel-form">Cancelar</button><button class="button" type="submit">Salvar registro</button></div></form></section>`;
}
function collectionPage() {
  if (ui.page === 'lotes') {
    const flocks = scoped('flocks'), houses = scoped('houses');
    return head('CRIAÇÃO','Plantel e instalações','Registre lotes, galpões, mortalidade e pesagens.',button('＋ Novo lote','flock')+button('＋ Galpão','house',true)) + farmWarning() + formHTML(ui.form)
      + `<div class="grid two-col">${card('Lotes',table(['Lote','Finalidade','Idade','Aves atuais','Mortalidade hoje','Situação',''],flocks.map((item)=>`<tr><td><strong>${esc(item.name)}</strong><br><small>${esc(item.breed||'Raça não informada')}</small></td><td>${esc(item.purpose)}</td><td>${days(item.date)} dias</td><td>${qty(currentBirds(item))} / ${qty(item.initial)}</td><td>${qty(sum(db.mortality.filter((r)=>r.flockId===item.id&&r.date===today()),'count'))} <button class="button small secondary" data-quick-mortality="${esc(item.id)}">＋</button></td><td><span class="chip${item.status==='ativo'?'':' gray'}">${esc(item.status)}</span></td><td class="actions">${del('flocks',item)}</td></tr>`),'Cadastre seu primeiro lote.'))}${card('Galpões',table(['Galpão','Ocupação',''],houses.map((item)=>{const birds=flocks.filter((f)=>f.houseId===item.id).reduce((s,f)=>s+currentBirds(f),0);return `<tr><td><strong>${esc(item.name)}</strong></td><td>${qty(birds)} / ${qty(item.capacity)} aves</td><td>${del('houses',item)}</td></tr>`}),'Cadastre galpões para organizar os lotes.'))}</div>`
      + `<div class="grid two-col" style="margin-top:1rem">${card('Mortalidade',`<div class="section-header">${button('＋ Registrar','mortality',true)}</div>${table(['Data','Lote','Aves',''],scoped('mortality').slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(flockName(item.flockId))}</td><td>${qty(item.count)}</td><td>${del('mortality',item)}</td></tr>`),'Sem registros de mortalidade.')}`)}${card('Pesagens',`<div class="section-header">${button('＋ Nova pesagem','weight',true)}</div>${table(['Data','Lote','Peso médio',''],scoped('weights').slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(flockName(item.flockId))}</td><td>${qty(item.kg,3)} kg</td><td>${del('weights',item)}</td></tr>`),'Sem pesagens.')}`)}</div>`;
  }
  if (ui.page === 'alimentacao') {
    const items = scoped('feed'), perBird = totals().current ? totals().feed / totals().current : 0;
    return head('ALIMENTAÇÃO','Consumo de ração','Acompanhe quanto foi distribuído para cada lote.',button('＋ Registrar ração','feed'))+farmWarning()+formHTML(ui.form)
      + `<div class="grid three-col">${kpi('🌽','Consumo acumulado',`${qty(totals().feed,2)} kg`)}${kpi('🐔','Por ave atual',`${qty(perBird,2)} kg`,'Consumo acumulado ÷ aves atuais')}${kpi('💸','Custo registrado',brl(sum(items,'cost')))}</div><div style="height:1rem"></div>`
      + card('Distribuições',table(['Data','Lote','Tipo','Quantidade','Custo',''],items.slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(flockName(item.flockId))}</td><td>${esc(item.type)}</td><td>${qty(item.kg,2)} kg</td><td>${brl(item.cost)}</td><td>${del('feed',item)}</td></tr>`),'Registre a primeira distribuição de ração.'));
  }
  if (ui.page === 'sanidade') {
    const items=scoped('vaccines'), tasks=scoped('tasks');
    return head('SANIDADE E MANEJO','Vacinas e atividades','Organize o calendário de cuidados da granja.',button('＋ Vacinação','vaccine')+button('＋ Tarefa','task',true))+farmWarning()+formHTML(ui.form)
    + `<div class="grid two-col">${card('Calendário de vacinação',table(['Data','Vacina','Lote','Status',''],items.slice().sort((a,b)=>a.date.localeCompare(b.date)).map((item)=>`<tr><td>${dateBR(item.date)}</td><td><strong>${esc(item.name)}</strong></td><td>${esc(flockName(item.flockId))}</td><td><button class="button small ${item.done?'secondary':'ghost'}" data-toggle="vaccines" data-id="${esc(item.id)}">${item.done?'Aplicada':'Marcar aplicada'}</button></td><td>${del('vaccines',item)}</td></tr>`),'Programe a primeira vacinação.'))}${card('Tarefas de manejo',table(['Data','Atividade','Status',''],tasks.slice().sort((a,b)=>a.date.localeCompare(b.date)).map((item)=>`<tr><td>${dateBR(item.date)}</td><td><strong>${esc(item.title)}</strong><br><small>${esc(item.note||'')}</small></td><td><button class="button small ${item.done?'secondary':'ghost'}" data-toggle="tasks" data-id="${esc(item.id)}">${item.done?'Feita':'Concluir'}</button></td><td>${del('tasks',item)}</td></tr>`),'Crie a primeira atividade.'))}</div>${calendarHTML()}`;
  }
  if (ui.page === 'financeiro') {
    const t=totals();
    return head('FINANCEIRO','Receitas e despesas','Saiba quanto entrou, saiu e o resultado da criação.',button('＋ Despesa','expense')+button('＋ Receita','revenue',true)+button('＋ Venda','sale',true))+farmWarning()+formHTML(ui.form)
      + `<div class="grid three-col">${kpi('💸','Despesas',brl(t.expense))}${kpi('💵','Receitas',brl(t.revenue),'Inclui vendas')}${kpi('📈','Resultado',brl(t.profit),'Receitas − despesas')}</div><div style="height:1rem"></div>`
      + `<div class="grid two-col">${card('Despesas',table(['Data','Descrição','Categoria','Valor',''],scoped('expenses').slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(item.description)}</td><td>${esc(item.category)}</td><td>${brl(item.amount)}</td><td>${del('expenses',item)}</td></tr>`),'Sem despesas.'))}${card('Receitas avulsas',table(['Data','Descrição','Origem','Valor',''],scoped('revenues').slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(item.description)}</td><td>${esc(item.category)}</td><td>${brl(item.amount)}</td><td>${del('revenues',item)}</td></tr>`),'Sem receitas avulsas.'))}</div>`
      + `<div style="height:1rem"></div>${card('Vendas de aves',table(['Data','Cliente','Lote','Aves','Total',''],scoped('sales').slice().reverse().map((item)=>`<tr><td>${dateBR(item.date)}</td><td>${esc(item.customer)}</td><td>${esc(flockName(item.flockId))}</td><td>${qty(item.quantity)}</td><td>${brl(item.quantity*item.price-item.discount)}</td><td>${del('sales',item)}</td></tr>`),'Sem vendas.'))}`;
  }
  if (ui.page === 'estoque') {
    const items=scoped('inventory');
    return head('ESTOQUE','Produtos e insumos','Controle quantidades, mínimos e validade.',button('＋ Novo item','inventory'))+farmWarning()+formHTML(ui.form)
      + card('Itens cadastrados',table(['Produto','Categoria','Disponível','Mínimo','Validade','Situação',''],items.map((item)=>`<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.category)}</td><td>${qty(item.quantity,2)} ${esc(item.unit)}</td><td>${qty(item.minimum,2)}</td><td>${dateBR(item.expiry)}</td><td><span class="chip${Number(item.quantity)<=Number(item.minimum)?' amber':''}">${Number(item.quantity)<=Number(item.minimum)?'Baixo':'OK'}</span></td><td>${del('inventory',item)}</td></tr>`),'Cadastre a ração, vacinas e outros produtos.'));
  }
  return '';
}
function reports() {
  const t=totals(), initial=sum(scoped('flocks'),'initial'), rate=initial?t.mortality/initial*100:0;
  return head('ANÁLISE','Relatórios simples','Resumo da propriedade selecionada e exportação dos registros.',`<button class="button" data-action="csv">⬇ Exportar CSV</button>`)+farmWarning()
    + `<div class="grid three-col">${kpi('🐔','Aves iniciais',qty(initial))}${kpi('☠️','Taxa de mortalidade',`${qty(rate,2)}%`,'Mortalidade ÷ aves iniciais')}${kpi('📈','Margem',`${qty(t.revenue?t.profit/t.revenue*100:0,2)}%`,'Resultado ÷ receitas')}</div><div style="height:1rem"></div>`
    + card('Resumo por lote',table(['Lote','Idade','Aves atuais','Mortalidade','Ração','Custo associado'],scoped('flocks').map((item)=>`<tr><td><strong>${esc(item.name)}</strong></td><td>${days(item.date)} dias</td><td>${qty(currentBirds(item))}</td><td>${qty(sum(scoped('mortality').filter((r)=>r.flockId===item.id),'count'))}</td><td>${qty(sum(scoped('feed').filter((r)=>r.flockId===item.id),'kg'),2)} kg</td><td>${brl(sum(scoped('expenses').filter((r)=>r.flockId===item.id),'amount')+sum(scoped('feed').filter((r)=>r.flockId===item.id),'cost'))}</td></tr>`),'Cadastre lotes para ver o relatório.'))
    + `<div class="notice warning" style="margin-top:1rem">Indicadores usam apenas dados registrados. Custos de alimentação lançados aqui não são somados automaticamente às despesas gerais para evitar dupla contagem; registre também uma despesa se quiser incluí-los no resultado financeiro.</div>`;
}
function settings() {
  return head('SEUS DADOS','Propriedades e backup','Gerencie dados locais com segurança.',button('＋ Propriedade','farm')+button('＋ Galpão','house',true))+formHTML(ui.form)
    + `<div class="grid two-col">${card('Propriedades',table(['Nome','Localização','Selecionada',''],db.farms.map((item)=>`<tr><td><strong>${esc(item.name)}</strong></td><td>${esc([item.city,item.state].filter(Boolean).join(' · ')||'—')}</td><td><button class="button small ${db.selectedFarm===item.id?'secondary':'ghost'}" data-select-farm="${esc(item.id)}">${db.selectedFarm===item.id?'Atual':'Selecionar'}</button></td><td>${del('farms',item)}</td></tr>`),'Cadastre uma propriedade para começar.'))}${card('Backup dos seus registros',`<p class="muted">Os dados ficam neste navegador. Faça backup antes de trocar de aparelho ou limpar o histórico.</p><div class="quick-actions"><button class="button" data-action="export">⬇ Exportar backup</button><label class="button secondary" for="backup-file">⬆ Restaurar backup</label><input id="backup-file" type="file" accept="application/json,.json" hidden></div><div class="divider"></div><div class="help-card"><strong>Sem login e sem sincronização</strong>Outro celular não verá estes dados até você importar o arquivo de backup nele.</div>`)}</div>`
    + `<div class="notice warning" style="margin-top:1rem"><strong>Projeto acadêmico de demonstração.</strong> Não use como única cópia de informações importantes da propriedade. Nenhum cadastro pessoal é enviado a servidores pelo aplicativo.</div>`;
}
function render() {
  if (!navigation.some(([key])=>key===ui.page)) ui.page='painel';
  if (ui.page==='painel') dashboard();
  else if (ui.page==='relatorios') layout(reports());
  else if (ui.page==='configuracoes') layout(settings());
  else if (ui.page==='mistura') layout(mixturePage());
  else if (ui.page==='saude') layout(healthPage());
  else if (ui.page==='orientacoes') layout(guidancePage());
  else layout(collectionPage());
}
function openForm(key, prefillFlockId = '') {
  const page = {farm:'configuracoes',house:'lotes',flock:'lotes',mortality:'lotes',weight:'lotes',feed:'alimentacao',vaccine:'sanidade',task:'sanidade',expense:'financeiro',revenue:'financeiro',sale:'financeiro',inventory:'estoque',formula:'mistura',vetNote:'orientacoes'}[key];
  if (key!=='farm'&&!farm()) { ui.page='configuracoes'; ui.form='farm'; location.hash='configuracoes'; render(); toast('Cadastre uma propriedade primeiro.'); return; }
  ui.page=page; ui.form=key; ui.prefillFlockId=prefillFlockId; location.hash=page; render(); document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function submitRecord(key, form) {
  const schema=schemas[key], values=Object.fromEntries(new FormData(form).entries());
  for (const [name,label,type,required,min] of schema.fields) {
    if (required && !String(values[name]||'').trim()) throw Error(`Preencha ${label.toLowerCase()}.`);
    if (type==='number') {
      values[name]=Number(values[name]||0);
      if (!Number.isFinite(values[name]) || values[name] < (min??0)) throw Error(`${label} deve ser no mínimo ${min??0}.`);
      if (Number.isInteger(min)&&min>=1 && !Number.isInteger(values[name])) throw Error(`${label} deve ser inteiro.`);
    }
  }
  if (key==='farm') { if (db.farms.some((item)=>item.name.toLowerCase()===values.name.trim().toLowerCase())) throw Error('Já existe uma propriedade com esse nome.'); }
  if (values.flockId && flock(values.flockId)?.farmId !== db.selectedFarm) throw Error('Lote inválido para esta propriedade.');
  if (key==='mortality' && values.count > currentBirds(flock(values.flockId))) throw Error('A mortalidade não pode superar as aves atuais do lote.');
  if (key==='sale') {
    if (values.quantity > currentBirds(flock(values.flockId))) throw Error('A venda não pode superar as aves atuais do lote.');
    if (values.discount > values.quantity*values.price) throw Error('Desconto maior que o total da venda.');
  }
  if (key==='house' && scoped('houses').some((item)=>item.name.toLowerCase()===values.name.trim().toLowerCase())) throw Error('Já existe um galpão com esse nome.');
  if (key==='flock' && values.houseId && !scoped('houses').some((item)=>item.id===values.houseId)) throw Error('Galpão inválido.');
  const record={id:id(),farmId:key==='farm'?'':db.selectedFarm,createdAt:new Date().toISOString(),...values};
  if (key==='flock' && !record.status) record.status='ativo';
  if (key==='vaccine'||key==='task') record.done=false;
  db[schema.collection].push(record);
  if (key==='farm'&&!db.selectedFarm) db.selectedFarm=record.id;
  if (!save()) { db[schema.collection].pop(); return; }
  ui.form=''; ui.prefillFlockId=''; render(); toast('Registro salvo neste aparelho.');
}
function removeRecord(collection,itemId) {
  if (!COLLECTIONS.includes(collection)) return;
  const item=db[collection].find((r)=>r.id===itemId); if (!item) return;
  if (collection==='farms' && COLLECTIONS.some((key)=>key!=='farms'&&db[key].some((r)=>r.farmId===itemId))) return toast('Exclua os registros desta propriedade antes de removê-la.',true);
  if (collection==='houses'&&db.flocks.some((r)=>r.houseId===itemId)) return toast('Há lotes vinculados a este galpão.',true);
  if (collection==='flocks'&&['mortality','feed','weights','vaccines','expenses','revenues','sales','tasks','vetNotes'].some((key)=>db[key].some((r)=>r.flockId===itemId))) return toast('Há registros vinculados a este lote.',true);
  if (!confirm('Excluir este registro? Essa ação não pode ser desfeita, exceto restaurando um backup.')) return;
  db[collection]=db[collection].filter((r)=>r.id!==itemId);
  if (collection==='farms'&&db.selectedFarm===itemId) db.selectedFarm=db.farms[0]?.id||'';
  save(); render(); toast('Registro excluído.');
}
function download(name,text,type) {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function exportBackup() { download(`granjasmart-backup-${today()}.json`,JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:db},null,2),'application/json'); toast('Backup exportado. Guarde o arquivo em local seguro.'); }
function exportCSV() {
  const rows=[['tipo','data','propriedade','lote','descricao','quantidade','valor']];
  for (const key of ['flocks','mortality','feed','weights','vaccines','expenses','revenues','sales','inventory','tasks']) for (const item of scoped(key)) rows.push([key,item.date||'',farm()?.name||'',item.flockId?flockName(item.flockId):'',item.description||item.name||item.title||'',item.count??item.kg??item.quantity??item.initial??'',item.amount??item.cost??(key==='sales'?item.quantity*item.price-item.discount:'')]);
  const csv='\ufeff'+rows.map((row)=>row.map((value)=>{const safe=String(value??'');return `"${(/^[\s]*[=+\-@]/.test(safe)?"'":'')+safe.replaceAll('"','""')}"`}).join(';')).join('\r\n');
  download(`granjasmart-relatorio-${today()}.csv`,csv,'text/csv;charset=utf-8'); toast('Relatório CSV exportado.');
}
async function importBackup(file) {
  if (!file) return;
  if (file.size > 5_000_000) return toast('Arquivo grande demais para este aplicativo.',true);
  try {
    const parsed=JSON.parse(await file.text());
    if (parsed.version!==1||!parsed.data||COLLECTIONS.some((key)=>!Array.isArray(parsed.data[key])||parsed.data[key].length>10000||parsed.data[key].some((item)=>!item||typeof item!=='object'||typeof item.id!=='string'))) throw Error('Formato inválido.');
    if (!confirm('Restaurar este backup substituirá TODOS os registros deste navegador. Deseja continuar?')) return;
    db={...fresh(),...Object.fromEntries(COLLECTIONS.map((key)=>[key,parsed.data[key]])),selectedFarm:parsed.data.selectedFarm||''};
    if (!db.farms.some((item)=>item.id===db.selectedFarm)) db.selectedFarm=db.farms[0]?.id||'';
    save(); render(); toast('Backup restaurado.');
  } catch (_) { toast('Não foi possível ler este backup.',true); }
}
document.addEventListener('click',(event)=>{
  const pageButton=event.target.closest('[data-page]'); if (pageButton) { ui.page=pageButton.dataset.page;ui.form='';ui.menu=false;location.hash=ui.page;render();window.scrollTo(0,0);return; }
  const newButton=event.target.closest('[data-new]'); if (newButton) { openForm(newButton.dataset.new);return; }
  const mortalityButton=event.target.closest('[data-quick-mortality]'); if (mortalityButton) { openForm('mortality',mortalityButton.dataset.quickMortality);return; }
  const deleteButton=event.target.closest('[data-delete]'); if (deleteButton) { removeRecord(deleteButton.dataset.delete,deleteButton.dataset.id);return; }
  const farmButton=event.target.closest('[data-select-farm]'); if (farmButton) { db.selectedFarm=farmButton.dataset.selectFarm;save();render();toast('Propriedade selecionada.');return; }
  const toggle=event.target.closest('[data-toggle]'); if (toggle) { const item=db[toggle.dataset.toggle]?.find((r)=>r.id===toggle.dataset.id);if(item){item.done=!item.done;save();render();toast('Atividade atualizada.')}return; }
  const action=event.target.closest('[data-action]')?.dataset.action;
  if (action==='menu') { ui.menu=true;render(); } else if (action==='close-menu') { ui.menu=false;render(); }
  else if (action==='cancel-form') { ui.form='';render(); } else if (action==='export') exportBackup(); else if (action==='csv') exportCSV();
});
document.addEventListener('submit',(event)=>{const form=event.target.closest('[data-form]');if(!form)return;event.preventDefault();try{submitRecord(form.dataset.form,form);}catch(error){toast(error.message,true);}});
document.addEventListener('change',(event)=>{if(event.target.id==='backup-file') importBackup(event.target.files?.[0]);});
window.addEventListener('hashchange',()=>{const next=(location.hash||'#painel').slice(1);if(next!==ui.page){ui.page=next;ui.form='';ui.menu=false;render();}});
window.addEventListener('online',render);window.addEventListener('offline',render);
if ('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
