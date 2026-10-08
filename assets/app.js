const firebaseConfig = {
  apiKey: "AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",
  authDomain: "formwheel.firebaseapp.com",
  databaseURL: "https://formwheel-default-rtdb.firebaseio.com",
  projectId: "formwheel",
  storageBucket: "formwheel.firebasestorage.app",
  messagingSenderId: "431583088241",
  appId: "1:431583088241:web:74e0e34ea1e3e1170c55d0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const auth=firebase.auth(),W=FormwheelWallet,LOCAL_KEY='formwheel_casino_practice_v2';
let currentUser='',accountName='',walletBusy=false,authLoading=true,walletGeneration=0;
let state=W.initial(todayStr());
try{const cached=JSON.parse(localStorage.getItem(LOCAL_KEY));if(cached?.version===2)state=cached}catch{}
function todayStr(){return new Date().toISOString().slice(0,10)}
function walletRef(){return db.ref('casinoV2/wallets/'+currentUser)}
function renderWallet(){
 document.getElementById('coins').textContent=state.coins;
 document.getElementById('accountBtn').textContent=authLoading?'인증 확인 중':(accountName||'로그인');
 const bg=W.catalog[state.equipped?.background],deco=W.catalog[state.equipped?.decoration];document.body.style.background=bg?.value||'#f7f8fc';
 if(accountName)document.getElementById('accountBtn').textContent=(deco?.value||'')+' '+accountName;
 const shop=document.getElementById('shop');shop.replaceChildren();
 for(const [id,item] of Object.entries(W.catalog)){const button=document.createElement('button');button.className='btn secondary';button.disabled=walletBusy||authLoading;const owned=state.inventory?.[id];button.textContent=item.name+(owned?' · 적용':' · '+item.price+' 코인');button.onclick=()=>transact({type:owned?'equip':'purchase',item:id}).catch(reportWallet);shop.append(button)}
 const history=document.getElementById('history');history.replaceChildren();Object.values(state.ledger||{}).sort((a,b)=>b.at-a.at).slice(0,30).forEach(entry=>{const li=document.createElement('li');li.textContent=new Date(entry.at).toLocaleString()+' · '+entry.label+' · '+(entry.delta>=0?'+':'')+entry.delta+' · 잔액 '+entry.balance;history.append(li)});
}
function reportWallet(e){document.getElementById('walletStatus').textContent='처리 실패: '+(e.code?window.FormwheelUI?.errorMessage(e)||e.message:e.message);renderWallet()}
async function transact(operation){
 if(walletBusy||authLoading)throw new Error('이전 거래 또는 인증 확인이 끝날 때까지 기다려주세요.');
 walletBusy=true;const generation=walletGeneration,uid=currentUser,op={...operation,id:crypto.randomUUID(),at:Date.now()};renderWallet();
 try{if(uid){const result=await db.ref('casinoV2/wallets/'+uid).transaction(cur=>W.apply(cur||W.initial(todayStr()),op));if(!result.committed)throw new Error('거래가 취소되었습니다');if(generation===walletGeneration)state=result.snapshot.val()}
 else{state=W.apply(state,op);try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state))}catch{}}
 if(generation===walletGeneration)document.getElementById('walletStatus').textContent=uid?'UID 계정 지갑에 저장했습니다. 게임 지급액은 아직 클라이언트 검증 방식입니다.':'이 기기의 연습 지갑에 저장했습니다.';
 return true;
 }finally{walletBusy=false;renderWallet()}
}
auth.onAuthStateChanged(async user=>{
 walletGeneration++;currentUser=user?.uid||'';accountName=user?.displayName||user?.email||'';authLoading=true;
 try{if(user){const result=await walletRef().transaction(cur=>cur||W.initial(todayStr()));state=result.snapshot.val()||W.initial(todayStr())}
 else{state=W.initial(todayStr());try{state=JSON.parse(localStorage.getItem(LOCAL_KEY))||state}catch{}}
 }catch(e){state=W.initial(todayStr());reportWallet(e)}finally{authLoading=false;renderWallet()}
 if(state.lastDaily!==todayStr())transact({type:'daily',day:todayStr()}).catch(reportWallet);
});
async function spend(n){if(walletBusy||authLoading||!Number.isInteger(n)||n<1||n>1000000||state.coins<n){alert('코인 또는 거래 상태를 확인하세요.');return false}try{await transact({type:'game',delta:-n,label:'게임 사용'});return true}catch(e){reportWallet(e);return false}}
// Payout waits for stake transaction; every change has its own receipt.
let payoutQueue=Promise.resolve();
function add(n){const generation=walletGeneration;payoutQueue=payoutQueue.then(async()=>{while(walletBusy)await new Promise(r=>setTimeout(r,30));if(generation!==walletGeneration)throw new Error('계정이 바뀌어 지급이 보류되었습니다.');await transact({type:'game',delta:n,label:'게임 지급'})}).catch(reportWallet)}
function openAccount(){if(walletBusy||(typeof bj!=='undefined'&&bj.active)){alert('현재 게임과 거래를 먼저 마쳐주세요.');return}document.getElementById('accountModal').classList.add('show');renderAuth(currentUser?'profile':'login')}
function closeAccount(){document.getElementById('accountModal').classList.remove('show')}
function renderAuth(mode){const area=document.getElementById('authArea'),title=document.getElementById('accountTitle');
 if(mode==='profile'){title.textContent='내 계정';area.innerHTML='<div class="user-info"></div><button class="btn" onclick="logout()">로그아웃</button>';area.firstChild.textContent=accountName+' · '+state.coins+' 코인';return}
 title.textContent=mode==='login'?'로그인':'회원가입';area.innerHTML=`<div class="auth-form"><input id="authUser" type="email" autocomplete="username" placeholder="이메일"><input id="authPass" type="password" minlength="6" autocomplete="${mode==='login'?'current-password':'new-password'}" placeholder="비밀번호 (6자 이상)"><button id="authSubmit" class="btn" onclick="${mode==='login'?'login()':'signup()'}">${mode==='login'?'로그인':'회원가입'}</button><button class="btn secondary" onclick="googleLogin()">Google로 로그인</button><p id="authError" role="alert"></p></div><div class="auth-switch"><button onclick="renderAuth('${mode==='login'?'signup':'login'}')">${mode==='login'?'회원가입':'로그인'}</button></div><p class="rules">기존 아이디 계정은 새 이메일 계정과 별개입니다. 기존 코인은 자동으로 옮기거나 삭제하지 않습니다. 비밀번호는 Firebase 인증에서 처리하며 데이터베이스에 저장하지 않습니다.</p>`;
}
async function authenticate(fn){const btn=document.getElementById('authSubmit');if(btn)btn.disabled=true;try{await fn();closeAccount()}catch(e){const box=document.getElementById('authError');if(box)box.textContent=window.FormwheelUI?.errorMessage(e)||e.message;else reportWallet(e)}finally{if(btn)btn.disabled=false}}
function login(){return authenticate(()=>auth.signInWithEmailAndPassword(document.getElementById('authUser').value.trim(),document.getElementById('authPass').value))}
function signup(){return authenticate(()=>auth.createUserWithEmailAndPassword(document.getElementById('authUser').value.trim(),document.getElementById('authPass').value))}
function googleLogin(){return authenticate(()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()))}
async function logout(){if(walletBusy||bj.active){alert('거래가 끝난 뒤 로그아웃하세요.');return}await auth.signOut();closeAccount()}
renderWallet();
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function openGame(type){
 document.getElementById('game').classList.add('active');
 const titles={roulette:'🎡 Roulette',blackjack:'🃏 Blackjack',dice:'🎲 Dice',coin:'🪙 Coin Flip',highlow:'⬆️ High & Low',jackpot:'🏆 Jackpot'};
 document.getElementById('gameTitle').textContent=titles[type];
 const body=document.getElementById('gameBody');
 if(type==='roulette') roulette(body);
 if(type==='blackjack') blackjack(body);
 if(type==='dice') dice(body);
 if(type==='coin') coin(body);
 if(type==='highlow') highlow(body);
 if(type==='jackpot') jackpot(body);
 document.getElementById('game').scrollIntoView({behavior:'smooth'});
}
function closeGame(){document.getElementById('game').classList.remove('active');}

function betBox(defaultBet=10){
 return `<div class="controls"><input id="bet" type="number" min="1" value="${defaultBet}"><span style="align-self:center;color:#aaa">코인 베팅</span></div>`;
}
function roulette(el){
 el.innerHTML=`<div class="status" id="rmsg">베팅하고 룰렛을 돌리세요</div><div class="wheel" id="wheel"><span>FORM</span></div>
 ${betBox()}<div class="choice"><button onclick="spinRoulette('red')">🔴 Red ×2</button><button onclick="spinRoulette('black')">⚫ Black ×2</button><button onclick="spinRoulette('even')">짝수 ×2</button><button onclick="spinRoulette('odd')">홀수 ×2</button></div>
 <div class="rules">룰렛은 0~36 중 하나가 랜덤으로 선택됩니다. 당첨 시 베팅 금액의 2배를 받습니다.</div>`;
}
async function spinRoulette(choice){
 const bet=+document.getElementById('bet').value;if(!await spend(bet))return;
 const n=Math.floor(Math.random()*37),red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
 const win=choice==='red'?red.includes(n):choice==='black'?n!==0&&!red.includes(n):choice==='even'?n!==0&&n%2===0:n!==0&&n%2===1;
 document.getElementById('rmsg').textContent=`🎯 ${n} — ${win?'🎉 당첨! +'+bet+' 코인':'😢 아쉽네요. -'+bet+' 코인'}`;
 if(win)add(bet*2);
}
function blackjack(el){
 el.innerHTML=`<div class="status" id="bmsg">베팅 후 Deal!</div><div class="cards" id="bcards"></div>${betBox(20)}
 <p class="hint">동점은 베팅 전액 환불입니다. 게임 중 새 Deal은 할 수 없습니다.</p><div class="controls"><button class="btn" id="deal" onclick="dealBJ()">Deal</button><button class="btn secondary" id="hit" onclick="hitBJ()" disabled>Hit</button><button class="btn secondary" id="stand" onclick="standBJ()" disabled>Stand</button></div>
 <div class="rules">간단한 싱글플레이 블랙잭입니다. 21에 가까운 쪽이 승리하며, 블랙잭은 2.5배 지급됩니다.</div>`;
 window.bj={active:false,player:[],dealer:[]};
}
const deckRanks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function card(){return deckRanks[Math.floor(Math.random()*deckRanks.length)];}
function val(cards){let s=0,a=0;cards.forEach(c=>{if(c==='A'){s+=11;a++}else s+=isNaN(+c)?10:+c});while(s>21&&a){s-=10;a--}return s;}
function renderBJ(){document.getElementById('bcards').innerHTML=`<div><b>You</b><div class="cards">${bj.player.map(x=>`<div class="playcard">${x}</div>`).join('')}</div></div><div><b>Dealer</b><div class="cards">${bj.dealer.map(x=>`<div class="playcard">${x}</div>`).join('')}</div></div>`;}
async function dealBJ(){if(bj.active){document.getElementById('bmsg').textContent='현재 게임을 먼저 마쳐주세요.';return}let bet=+document.getElementById('bet').value;if(!await spend(bet))return;bj={active:true,bet,player:[card(),card()],dealer:[card(),card()]};renderBJ();document.getElementById('hit').disabled=false;document.getElementById('stand').disabled=false;document.getElementById('bmsg').textContent='카드를 선택하세요';document.getElementById('deal').disabled=true;if(val(bj.player)===21)standBJ();}
function hitBJ(){if(!bj.active)return;bj.player.push(card());renderBJ();if(val(bj.player)>21)finishBJ(false);}
function standBJ(){if(!bj.active)return;while(val(bj.dealer)<17)bj.dealer.push(card());renderBJ();const pv=val(bj.player),dv=val(bj.dealer);finishBJ(pv===dv?'push':pv<=21&&(dv>21||pv>dv));}
function finishBJ(win){if(!bj.active)return;bj.active=false;let pv=val(bj.player),dv=val(bj.dealer);let msg=pv>21?'💥 Bust!':win==='push'?`🤝 무승부 · 베팅 ${bj.bet} 환불`:win?`🎉 승리! +${bj.bet*2}`:'😢 패배!';if(win==='push'){add(bj.bet);}else if(pv===21&&bj.player.length===2){add(Math.floor(bj.bet*2.5));msg=`🃏 Blackjack! +${bj.bet*2.5}`;}else if(win)add(bj.bet*2);document.getElementById('deal').disabled=false;document.getElementById('bmsg').textContent=`${msg} (You ${pv} / Dealer ${dv})`;document.getElementById('hit').disabled=true;document.getElementById('stand').disabled=true;}

function dice(el){
 el.innerHTML=`<div class="status" id="dmsg">두 주사위의 합을 맞혀보세요</div>${betBox(10)}<div class="choice"><button onclick="rollDice('low')">1~6 ×2</button><button onclick="rollDice('high')">8~12 ×2</button><button onclick="rollDice('seven')">7 ×5</button></div>`;
}
async function rollDice(c){let bet=+document.getElementById('bet').value;if(!await spend(bet))return;let a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),s=a+b,win=c==='low'?s<=6:c==='high'?s>=8:s===7;let mult=c==='seven'?5:2;if(win)add(bet*mult);document.getElementById('dmsg').textContent=`🎲 ${a} + ${b} = ${s} — ${win?'🎉 +'+bet*mult:'😢 -'+bet}`;}

function coin(el){el.innerHTML=`<div class="status" id="cmsg">앞면 또는 뒷면을 고르세요</div>${betBox(10)}<div class="choice"><button onclick="flipCoin('앞면')">☀️ 앞면 ×2</button><button onclick="flipCoin('뒷면')">🌙 뒷면 ×2</button></div>`;}
async function flipCoin(c){let bet=+document.getElementById('bet').value;if(!await spend(bet))return;let r=Math.random()<.5?'앞면':'뒷면',win=r===c;if(win)add(bet*2);document.getElementById('cmsg').textContent=`🪙 ${r}! ${win?'🎉 +'+bet*2:'😢 -'+bet}`;}

function highlow(el){el.innerHTML=`<div class="status" id="hmsg">첫 카드: ?</div><div class="cards"><div class="playcard" id="hcard">?</div></div>${betBox(10)}<div class="choice"><button onclick="playHL('high')">⬆️ Higher ×2</button><button onclick="playHL('low')">⬇️ Lower ×2</button></div><div class="rules">다음 카드가 현재 카드보다 높은지 낮은지 맞혀보세요.</div>`;window.hl=2+Math.floor(Math.random()*12);document.getElementById('hcard').textContent=deckRanks[hl-2]||'A';}
async function playHL(c){let bet=+document.getElementById('bet').value;if(!await spend(bet))return;let n=2+Math.floor(Math.random()*12),win=c==='high'?n>hl:n<hl;document.getElementById('hmsg').textContent=`${hl} → ${n} — ${win?'🎉 +'+bet*2:'😢 -'+bet}`;if(win)add(bet*2);hl=n;document.getElementById('hcard').textContent=deckRanks[hl-2]||'A';}

function jackpot(el){el.innerHTML=`<div class="status" id="jmsg">3개의 슬롯을 맞혀보세요!</div>${betBox(10)}<div class="cards" id="slots"><div class="playcard">🍒</div><div class="playcard">🍋</div><div class="playcard">⭐</div></div><div class="controls"><button class="btn" onclick="spinJackpot()">SPIN</button></div><div class="rules">3개 일치: 10배 · 2개 일치: 3배 · 모두 다름: 꽝</div>`;}
async function spinJackpot(){let bet=+document.getElementById('bet').value;if(!await spend(bet))return;let s=['🍒','🍋','⭐','7️⃣','💎'],a=[0,1,2].map(()=>s[Math.floor(Math.random()*s.length)]);document.getElementById('slots').innerHTML=a.map(x=>`<div class="playcard">${x}</div>`).join('');let same=a[0]===a[1]&&a[1]===a[2],pair=new Set(a).size===2;if(same)add(bet*10);else if(pair)add(bet*3);document.getElementById('jmsg').textContent=same?`🎰 JACKPOT! +${bet*10}`:pair?`✨ 2개 일치! +${bet*3}`:`😢 꽝! -${bet}`;}
