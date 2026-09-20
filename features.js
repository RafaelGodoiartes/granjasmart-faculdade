/* Módulos locais de mistura, saúde e orientações. Sem backend ou diagnóstico automático. */
const FEED_PHASES = ['Pré-inicial','Inicial','Crescimento','Postura'];
const SYMPTOMS = [
  {id:'quieta',icon:'🐔',label:'Ave quieta ou encorujada'},
  {id:'respiratorio',icon:'💨',label:'Espirros ou secreção no bico'},
  {id:'inchaco',icon:'👁️',label:'Rosto ou olhos inchados'},
  {id:'crostas',icon:'🟠',label:'Crostas na crista ou na pele'},
  {id:'diarreia',icon:'💧',label:'Diarreia amarela ou branca'},
  {id:'sangue',icon:'🩸',label:'Fezes com sangue'},
  {id:'casca',icon:'🥚',label:'Ovos com casca fina'},
  {id:'mortes',icon:'⚠️',label:'Muitas mortes em pouco tempo'}
];
const HEALTH_CARDS = [
  {id:'respiratorio',match:['respiratorio','inchaco'],title:'Sinais respiratórios',risk:'Alto',possibilities:'Coriza infecciosa é uma possibilidade quando há espirros, secreção e inchaço facial; outras doenças também podem causar sinais semelhantes.',action:'Separe aves doentes se isso puder ser feito com segurança, reduza a circulação de pessoas entre lotes e procure um médico-veterinário. Se muitos animais estiverem afetados ou houver mortes súbitas, contate também o Serviço Veterinário Oficial.',source:'https://www.merckvetmanual.com/poultry/infectious-coryza/infectious-coryza'},
  {id:'crostas',match:['crostas'],title:'Lesões ou crostas na pele',risk:'Médio',possibilities:'Bouba aviária é uma possibilidade, mas a avaliação das lesões é necessária para distinguir outras causas.',action:'Evite manipular lesões sem orientação, registre fotos para mostrar ao veterinário e confira as condições de higiene do ambiente.',source:'https://www.merckvetmanual.com/poultry/fowlpox/fowlpox-in-chickens-and-turkeys'},
  {id:'intestinal',match:['diarreia','sangue'],title:'Alterações nas fezes',risk:'Alto',possibilities:'Coccidiose é uma possibilidade, especialmente com fezes sanguinolentas, mas a cor das fezes sozinha não identifica a causa.',action:'Verifique água e cama, registre quantas aves estão afetadas e procure avaliação veterinária antes de tratar.',source:'https://www.merckvetmanual.com/poultry/coccidiosis-in-poultry/coccidiosis-in-poultry'},
  {id:'casca',match:['casca'],title:'Casca de ovo fina',risk:'Médio',possibilities:'Pode envolver alimentação, manejo ou sanidade. Não é possível identificar a causa apenas pela aparência do ovo.',action:'Registre o lote e a frequência, confira água e ração e peça revisão da dieta e da saúde do plantel ao técnico responsável.',source:'https://www.gov.br/agricultura/pt-br/assuntos/sanidade-animal-e-vegetal/saude-animal/programas-de-saude-animal/pnsa/biosseguridade'},
  {id:'geral',match:['quieta'],title:'Ave abatida ou encorujada',risk:'Médio',possibilities:'É um sinal inespecífico que pode aparecer em diferentes problemas de saúde ou ambiente.',action:'Observe água, consumo de ração, temperatura e outras aves do lote. Se persistir ou se espalhar, procure um veterinário.',source:'https://www.gov.br/agricultura/pt-br/assuntos/sanidade-animal-e-vegetal/saude-animal/programas-de-saude-animal/pnsa/biosseguridade'},
  {id:'urgente',match:['mortes'],title:'Mortalidade súbita ou elevada',risk:'Crítico',possibilities:'Há várias causas possíveis, inclusive doenças de notificação obrigatória. Não tente concluir o diagnóstico pelo aplicativo.',action:'Evite movimentar aves e materiais. Contate imediatamente um médico-veterinário e o Serviço Veterinário Oficial da região.',source:'https://www.gov.br/agricultura/pt-br/assuntos/sanidade-animal-e-vegetal/saude-animal/programas-de-saude-animal/pnsa/notificacao-de-doencas'}
];
function ingredientIcon(name) {
  const n=String(name).toLowerCase();
  if(n.includes('milho'))return '🌽'; if(n.includes('soja'))return '🫘'; if(n.includes('calcário')||n.includes('calcario'))return '🪨';
  if(n.includes('núcleo')||n.includes('nucleo'))return '🧪'; if(n.includes('óleo')||n.includes('oleo'))return '🫙'; return '🌾';
}
function formulaRow(name='',percent='',order='') {
  return `<div class="ingredient-row"><div class="field"><label>Ingrediente</label><input name="ingredientName" required maxlength="60" value="${esc(name)}" placeholder="Ex.: milho"></div><div class="field"><label>Percentual (%)</label><input name="ingredientPercent" type="number" required min="0.001" max="100" step="0.001" value="${esc(percent)}"></div><div class="field"><label>Ordem de inclusão</label><input name="ingredientOrder" type="number" required min="1" step="1" value="${esc(order)}"></div><button type="button" class="button small danger" data-remove-ingredient aria-label="Remover ingrediente">×</button></div>`;
}
function formulaFormHTML() {
  if(ui.form!=='formula')return '';
  return `<section class="card form-card"><h2>Nova fórmula de ração</h2><div class="notice warning">A fórmula é informada e salva neste aparelho. O aplicativo não verifica se quem a cadastrou é veterinário e não avalia se ela atende às necessidades nutricionais das aves.</div>
    <form data-feature-form="formula"><div class="form-grid"><div class="field"><label for="formula-name">Nome da fórmula *</label><input id="formula-name" name="name" required maxlength="80" placeholder="Ex.: inicial do lote A"></div><div class="field"><label for="formula-phase">Fase *</label><select id="formula-phase" name="phase" required><option value="">Selecione</option>${FEED_PHASES.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="field"><label for="formula-responsible">Profissional que forneceu a fórmula *</label><input id="formula-responsible" name="responsible" required maxlength="100" placeholder="Nome informado por você"></div><div class="field"><label for="formula-date">Data *</label><input id="formula-date" name="date" type="date" required value="${today()}"></div><div class="field wide"><label for="formula-instructions">Orientações de preparo</label><textarea id="formula-instructions" name="instructions" maxlength="1000" placeholder="Tempo de mistura e outros cuidados indicados pelo profissional"></textarea></div></div>
    <h3>Ingredientes e proporções</h3><p class="muted">Os percentuais devem somar exatamente 100%. A ordem de inclusão deve seguir a orientação do profissional.</p><div class="ingredient-rows">${formulaRow('Milho','',1)}${formulaRow('Farelo de soja','',2)}${formulaRow('Núcleo','',3)}${formulaRow('Calcário','',4)}</div>
    <button type="button" class="button secondary" data-add-ingredient>＋ Ingrediente</button><div class="form-actions"><button type="button" class="button secondary" data-action="cancel-form">Cancelar</button><button class="button" type="submit">Salvar fórmula</button></div></form></section>`;
}
function mixturePage() {
  const formulas=scoped('formulas');
  const chosen=formulas.find(x=>x.id===ui.mixFormulaId)||formulas[0];
  if(chosen)ui.mixFormulaId=chosen.id;
  const filtered=ui.formulaPhase==='Todas'?formulas:formulas.filter(x=>x.phase===ui.formulaPhase);
  const amount=Number(ui.mixKg)||0;
  const steps=chosen?[{icon:'⚖️',title:'Prepare a pesagem',detail:'Confira a fórmula, a balança e a quantidade total antes de começar.'},...chosen.ingredients.slice().sort((a,b)=>a.order-b.order).map(x=>({icon:ingredientIcon(x.name),title:`Inclua ${x.name}`,detail:`Pese ${qty(amount*x.percent/100,3)} kg (${qty(x.percent,3)}%). Siga a ordem indicada pelo profissional.`})),{icon:'✅',title:'Finalize a mistura',detail:chosen.instructions||'Misture conforme a orientação do profissional responsável e identifique o lote da ração.'}]:[];
  ui.mixStep=Math.min(ui.mixStep,Math.max(0,steps.length-1));
  return head('ALIMENTAÇÃO','Calculadora e guia de mistura','Calcule os ingredientes conforme uma fórmula informada pelo profissional.',button('＋ Nova fórmula','formula'))+farmWarning()+formulaFormHTML()
    + `<div class="notice warning"><strong>Segurança da ração:</strong> esta calculadora apenas multiplica percentuais. Nenhuma fórmula padrão foi inserida. Peça ao veterinário ou nutricionista para definir composição, sequência e modo de preparo.</div>
    <div class="phase-tabs"><button class="chip-button${ui.formulaPhase==='Todas'?' active':''}" data-formula-phase="Todas">Todas</button>${FEED_PHASES.map(x=>`<button class="chip-button${ui.formulaPhase===x?' active':''}" data-formula-phase="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div class="grid two-col">${card('Fórmulas salvas',filtered.length?`<div class="formula-list">${filtered.map(x=>`<div class="formula-entry"><div><strong>${esc(x.name)}</strong><small>${esc(x.phase)} · informado por ${esc(x.responsible)}</small></div><div class="quick-actions"><button class="button small ${chosen?.id===x.id?'':'secondary'}" data-choose-formula="${esc(x.id)}">${chosen?.id===x.id?'Em uso':'Usar'}</button>${del('formulas',x)}</div></div>`).join('')}</div>`:empty('Cadastre uma fórmula revisada pelo profissional responsável.'))}
    ${card('Quantidade para preparar',chosen?`<p class="muted">Fórmula: <strong>${esc(chosen.name)}</strong></p><div class="field"><label for="mix-kg">Quantidade total desejada (kg)</label><input id="mix-kg" type="number" min="0.001" step="0.001" value="${esc(ui.mixKg)}"></div><div class="mix-results">${chosen.ingredients.map(x=>`<div class="mix-result"><span>${ingredientIcon(x.name)} ${esc(x.name)} <small>${qty(x.percent,3)}%</small></span><strong data-mix-percent="${x.percent}">${qty(amount*x.percent/100,3)} kg</strong></div>`).join('')}</div><div class="summary-row"><strong>Total</strong><strong id="mix-total">${qty(amount,3)} kg</strong></div>`:empty('Selecione ou cadastre uma fórmula.'))}</div>
    ${chosen?`<div style="height:1rem"></div>${card('Modo visual de preparo',`<div class="prep-step"><div class="prep-icon">${steps[ui.mixStep].icon}</div><div><small>Passo ${ui.mixStep+1} de ${steps.length}</small><h3>${esc(steps[ui.mixStep].title)}</h3><p>${esc(steps[ui.mixStep].detail)}</p></div></div><div class="step-controls"><button class="button secondary" data-step="-1" ${ui.mixStep===0?'disabled':''}>← Anterior</button><button class="button" data-step="1" ${ui.mixStep===steps.length-1?'disabled':''}>Próximo →</button></div>`)}`:''}`;
}
function healthPage() {
  const selected=new Set(ui.selectedSymptoms);
  const relevant=HEALTH_CARDS.filter(x=>x.match.some(id=>selected.has(id))).sort((a,b)=>(a.risk==='Crítico'?-1:0)-(b.risk==='Crítico'?-1:0));
  return head('SANIDADE','Guia visual de saúde','Escolha o que você vê nas aves. Este guia não fornece diagnóstico.',`<button class="button secondary" data-page="orientacoes">📋 Orientações salvas</button>`)
    + `<div class="notice warning"><strong>Importante:</strong> sinais parecidos podem ter causas diferentes. Não medique as aves com base neste guia. Procure um médico-veterinário; suspeitas de influenza aviária ou Newcastle devem ser notificadas ao Serviço Veterinário Oficial.</div>
    ${card('O que você está observando?',`<div class="symptom-grid">${SYMPTOMS.map(x=>`<button class="symptom-choice${selected.has(x.id)?' selected':''}" data-symptom="${x.id}" aria-pressed="${selected.has(x.id)}"><span>${x.icon}</span>${esc(x.label)}</button>`).join('')}</div>`)}
    <div style="height:1rem"></div>${card('Orientação inicial',relevant.length?`<div class="health-grid">${relevant.map(x=>`<article class="health-card"><span class="chip ${x.risk==='Crítico'?'red':x.risk==='Alto'?'amber':''}">Atenção: ${esc(x.risk)}</span><h3>${esc(x.title)}</h3><p><strong>Possibilidades:</strong> ${esc(x.possibilities)}</p><p><strong>O que fazer agora:</strong> ${esc(x.action)}</p><a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">Fonte técnica ↗</a></article>`).join('')}</div>`:empty('Selecione um ou mais sinais para ver orientações iniciais.'))}
    <div class="notice" style="margin-top:1rem">As fichas e ilustrações acima ficam disponíveis offline depois da primeira visita. Links externos de fontes técnicas precisam de internet. Medicamentos só devem aparecer em prescrições registradas pelo profissional na área Orientações.</div>`;
}
function guidanceFormHTML() {
  if(ui.form!=='vetNote')return '';
  return `<section class="card form-card"><h2>Salvar orientação recebida</h2><form data-feature-form="vetNote"><div class="form-grid"><div class="field"><label for="note-title">Título *</label><input id="note-title" name="title" maxlength="100" required placeholder="Ex.: orientação de vacinação"></div><div class="field"><label for="note-type">Tipo *</label><select id="note-type" name="type" required><option value="">Selecione</option><option>Receita</option><option>Prescrição</option><option>Orientação</option></select></div><div class="field"><label for="note-responsible">Profissional responsável *</label><input id="note-responsible" name="responsible" maxlength="100" required></div><div class="field"><label for="note-date">Data *</label><input id="note-date" name="date" type="date" required value="${today()}"></div><div class="field wide"><label for="note-flock">Lote relacionado</label><select id="note-flock" name="flockId"><option value="">Nenhum</option>${scoped('flocks').map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div><div class="field wide"><label for="note-content">Texto da receita ou orientação *</label><textarea id="note-content" name="content" maxlength="5000" required placeholder="Transcreva fielmente o documento recebido. Não crie uma prescrição nova aqui."></textarea></div></div><div class="form-actions"><button type="button" class="button secondary" data-action="cancel-form">Cancelar</button><button class="button" type="submit">Salvar neste aparelho</button></div></form></section>`;
}
function guidancePage() {
  const notes=scoped('vetNotes').slice().sort((a,b)=>b.date.localeCompare(a.date));
  return head('CONSULTA OFFLINE','Receitas e orientações','Guarde textos recebidos do profissional responsável para consultar sem internet.',button('＋ Salvar orientação','vetNote'))+farmWarning()+guidanceFormHTML()
    + `<div class="notice warning">Esta área não verifica assinaturas ou credenciais. Registre somente orientações realmente recebidas do profissional. Os textos ficam neste navegador; exporte backup regularmente.</div>`
    + (notes.length?`<div class="health-grid">${notes.map(x=>`<section class="card note-card"><span class="chip">${esc(x.type)}</span><h2>${esc(x.title)}</h2><p class="muted">${dateBR(x.date)} · ${esc(x.responsible)}${x.flockId?' · '+esc(flockName(x.flockId)):''}</p><p class="note-content">${esc(x.content)}</p>${del('vetNotes',x)}</section>`).join('')}</div>`:card('Orientações',empty('Nenhuma orientação salva neste aparelho.')));
}
function calendarHTML() {
  const events=[...scoped('vaccines').filter(x=>!x.done).map(x=>({date:x.date,title:`💉 ${x.name}`,detail:flockName(x.flockId)})),...scoped('tasks').filter(x=>!x.done).map(x=>({date:x.date,title:`📅 ${x.title}`,detail:x.flockId?flockName(x.flockId):'Manejo'}))].sort((a,b)=>a.date.localeCompare(b.date));
  const [year,month]=ui.calendarMonth.split('-').map(Number);
  const first=new Date(year,month-1,1), monthDays=new Date(year,month,0).getDate(), offset=(first.getDay()+6)%7;
  const rawLabel=first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}), label=rawLabel.charAt(0).toLocaleUpperCase('pt-BR')+rawLabel.slice(1);
  const dayCells=Array.from({length:offset},()=>'<span class="calendar-blank"></span>');
  for(let day=1;day<=monthDays;day++){
    const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const count=events.filter(x=>x.date===date).length;
    dayCells.push(`<button type="button" class="calendar-day${date===today()?' today':''}${date===ui.calendarDay?' selected':''}" data-calendar-day="${date}" aria-label="${day} de ${label}${count?`, ${count} atividade${count>1?'s':''}`:''}" aria-pressed="${date===ui.calendarDay}"><span>${day}</span>${count?`<i>${count}</i>`:''}</button>`);
  }
  const selected=events.filter(x=>x.date===ui.calendarDay);
  const entries=selected.length?selected.map(x=>`<div class="timeline-item"><span>${esc(x.title)}<small>${esc(x.detail)}</small></span><span class="chip ${x.date<today()?'red':x.date===today()?'amber':''}">${x.date<today()?'Atrasado':x.date===today()?'Hoje':'Pendente'}</span></div>`).join(''):empty('Nenhuma atividade pendente neste dia.');
  return `<div style="height:1rem"></div>${card('Agenda e lembretes',`<div class="calendar-toolbar"><button class="button small secondary" data-calendar-move="-1" aria-label="Mês anterior">←</button><strong>${esc(label)}</strong><button class="button small secondary" data-calendar-move="1" aria-label="Próximo mês">→</button></div><div class="calendar-grid" aria-label="Calendário de manejo e vacinação">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=>`<span class="calendar-weekday">${x}</span>`).join('')}${dayCells.join('')}</div><h3 class="calendar-selection">${dateBR(ui.calendarDay)}</h3><div class="timeline">${entries}</div><p class="muted calendar-help">Números nos dias mostram tarefas e vacinações pendentes. Alertas aparecem quando você abre o app; notificações com o aplicativo fechado ainda não estão disponíveis.</p>`)}`;
}
function saveFeatureRecord(kind,form) {
  const data=new FormData(form);
  if(kind==='formula') {
    const names=data.getAll('ingredientName').map(x=>String(x).trim());
    const percents=data.getAll('ingredientPercent').map(Number);
    const orders=data.getAll('ingredientOrder').map(Number);
    if(names.length<2||names.some(x=>!x)||new Set(names.map(x=>x.toLowerCase())).size!==names.length)throw Error('Informe pelo menos dois ingredientes diferentes.');
    if(percents.some(x=>!Number.isFinite(x)||x<=0)||Math.abs(percents.reduce((a,b)=>a+b,0)-100)>0.001)throw Error('Os percentuais devem somar exatamente 100%.');
    if(orders.some(x=>!Number.isInteger(x)||x<1)||new Set(orders).size!==orders.length)throw Error('Defina uma ordem de inclusão diferente para cada ingrediente.');
    const record={id:id(),farmId:db.selectedFarm,name:String(data.get('name')).trim(),phase:String(data.get('phase')),responsible:String(data.get('responsible')).trim(),date:String(data.get('date')),instructions:String(data.get('instructions')||'').trim(),ingredients:names.map((name,i)=>({name,percent:percents[i],order:orders[i]})),createdAt:new Date().toISOString()};
    if(!record.name||!FEED_PHASES.includes(record.phase)||!record.responsible||!record.date)throw Error('Preencha nome, fase, profissional e data.');
    db.formulas.push(record);ui.mixFormulaId=record.id;ui.mixStep=0;
    if(!save()){db.formulas.pop();return;}
  } else if(kind==='vetNote') {
    const record={id:id(),farmId:db.selectedFarm,title:String(data.get('title')).trim(),type:String(data.get('type')),responsible:String(data.get('responsible')).trim(),date:String(data.get('date')),flockId:String(data.get('flockId')||''),content:String(data.get('content')).trim(),createdAt:new Date().toISOString()};
    if(!record.title||!['Receita','Prescrição','Orientação'].includes(record.type)||!record.responsible||!record.date||!record.content)throw Error('Preencha todos os campos obrigatórios.');
    if(record.flockId&&flock(record.flockId)?.farmId!==db.selectedFarm)throw Error('Lote inválido.');
    db.vetNotes.push(record);if(!save()){db.vetNotes.pop();return;}
  }
  ui.form='';render();toast('Salvo neste aparelho para consulta offline.');
}
document.addEventListener('click',event=>{
  const add=event.target.closest('[data-add-ingredient]');if(add){const rows=add.closest('form').querySelector('.ingredient-rows');rows.insertAdjacentHTML('beforeend',formulaRow('','',rows.children.length+1));return;}
  const remove=event.target.closest('[data-remove-ingredient]');if(remove){const rows=remove.closest('.ingredient-rows');if(rows.children.length>2)remove.closest('.ingredient-row').remove();else toast('Mantenha pelo menos dois ingredientes.',true);return;}
  const phase=event.target.closest('[data-formula-phase]');if(phase){ui.formulaPhase=phase.dataset.formulaPhase;render();return;}
  const chosen=event.target.closest('[data-choose-formula]');if(chosen){ui.mixFormulaId=chosen.dataset.chooseFormula;ui.mixStep=0;render();return;}
  const step=event.target.closest('[data-step]');if(step){ui.mixStep+=Number(step.dataset.step);render();return;}
  const symptom=event.target.closest('[data-symptom]');if(symptom){const id=symptom.dataset.symptom;ui.selectedSymptoms=ui.selectedSymptoms.includes(id)?ui.selectedSymptoms.filter(x=>x!==id):[...ui.selectedSymptoms,id];render();return;}
  const month=event.target.closest('[data-calendar-move]');if(month){const [year,number]=ui.calendarMonth.split('-').map(Number);const moved=new Date(year,number-1+Number(month.dataset.calendarMove),1);ui.calendarMonth=`${moved.getFullYear()}-${String(moved.getMonth()+1).padStart(2,'0')}`;ui.calendarDay=`${ui.calendarMonth}-01`;render();return;}
  const day=event.target.closest('[data-calendar-day]');if(day){ui.calendarDay=day.dataset.calendarDay;render();return;}
});
document.addEventListener('change',event=>{if(event.target.id==='mix-kg'){const value=Number(event.target.value);if(!Number.isFinite(value)||value<=0||value>100000)return toast('Informe uma quantidade entre 0 e 100.000 kg.',true);ui.mixKg=value;ui.mixStep=0;render();}});
document.addEventListener('input',event=>{if(event.target.id!=='mix-kg')return;const value=Number(event.target.value);if(!Number.isFinite(value)||value<=0||value>100000)return;ui.mixKg=value;ui.mixStep=0;document.querySelectorAll('[data-mix-percent]').forEach(node=>{node.textContent=`${qty(value*Number(node.dataset.mixPercent)/100,3)} kg`;});const total=document.querySelector('#mix-total');if(total)total.textContent=`${qty(value,3)} kg`;});
document.addEventListener('submit',event=>{const form=event.target.closest('[data-feature-form]');if(!form)return;event.preventDefault();try{saveFeatureRecord(form.dataset.featureForm,form);}catch(error){toast(error.message,true);}});
