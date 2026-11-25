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
let currentUser='',accountName='',walletBusy=false,authLoading=true,walletGeneration=0,accountBalance=null;
let accountWalletStatus='';
let state=W.initial(todayStr());
try{const cached=JSON.parse(localStorage.getItem(LOCAL_KEY));if(cached?.version===2)state=cached}catch{}
function todayStr(){return new Date().toISOString().slice(0,10)}
function renderWalletStatus(detail){
 document.getElementById('walletStatus').textContent=[detail,accountWalletStatus].filter(Boolean).join(' · ');
}
function renderWallet(){
 document.getElementById('coins').textContent=state.coins;
 document.getElementById('accountBtn').textContent=authLoading?'인증 확인 중':(accountName||'로그인');
 const bg=W.catalog[state.equipped?.background],deco=W.catalog[state.equipped?.decoration];document.body.style.background=bg?.value||'#f7f8fc';
 if(accountName)document.getElementById('accountBtn').textContent=(deco?.value||'')+' '+accountName;
 const shop=document.getElementById('shop');shop.replaceChildren();
 for(const [id,item] of Object.entries(W.catalog)){const button=document.createElement('button');button.className='btn secondary';button.disabled=walletBusy||authLoading;const owned=state.inventory?.[id];button.textContent=item.name+(owned?' · 적용':' · '+item.price+' 코인');button.onclick=()=>transact({type:owned?'equip':'purchase',item:id}).catch(reportWallet);shop.append(button)}
 const history=document.getElementById('history');history.replaceChildren();Object.values(state.ledger||{}).sort((a,b)=>b.at-a.at).slice(0,30).forEach(entry=>{const li=document.createElement('li');li.textContent=new Date(entry.at).toLocaleString()+' · '+entry.label+' · '+(entry.delta>=0?'+':'')+entry.delta+' · 잔액 '+entry.balance;history.append(li)});
}
function reportWallet(e){renderWalletStatus('처리 실패: '+(e.code?window.FormwheelUI?.errorMessage(e)||e.message:e.message));renderWallet()}
async function transact(operation){
 if(walletBusy||authLoading)throw new Error('이전 거래 또는 인증 확인이 끝날 때까지 기다려주세요.');
 walletBusy=true;
 const op={...operation,id:crypto.randomUUID(),at:Date.now()};
 renderWallet();
 try{
  const next=W.apply(state,op);
  localStorage.setItem(LOCAL_KEY,JSON.stringify(next));
  state=next;
  renderWalletStatus('이 기기의 연습 지갑에 저장했어요.');
 return true;
 }finally{walletBusy=false;renderWallet()}
}
auth.onAuthStateChanged(async user=>{
 const generation=++walletGeneration;
 currentUser=user?.uid||'';
 accountName=user?.displayName||user?.email||(user?'로그인 계정':'');
 accountBalance=null;
 authLoading=false;
 accountWalletStatus=user?'계정 지갑 조회 중':'';
 renderWallet();
 renderWalletStatus('기기 연습 지갑');

 if(!user)return;
 try{
  const data=(await db.ref('casinoV2/wallets/'+user.uid).once('value')).val();
  if(generation!==walletGeneration)return;
  accountBalance=Number.isSafeInteger(data?.coins)&&data.coins>=0?data.coins:null;
  accountWalletStatus=accountBalance===null?'저장된 계정 지갑 없음':'계정 지갑 '+accountBalance.toLocaleString()+' 코인 (조회 전용)';
 }catch{
  if(generation!==walletGeneration)return;
  accountWalletStatus='계정 지갑을 불러오지 못했어요.';
 }
 renderWalletStatus('기기 연습 지갑');
});
function openAccount(){if(walletBusy||(typeof bj!=='undefined'&&bj.active)){alert('현재 게임과 거래를 먼저 마쳐주세요.');return}document.getElementById('accountModal').classList.add('show');renderAuth(currentUser?'profile':'login')}
function closeAccount(){document.getElementById('accountModal').classList.remove('show')}
function renderAuth(mode){const area=document.getElementById('authArea'),title=document.getElementById('accountTitle');
 if(mode==='profile'){title.textContent='내 계정';area.innerHTML='<div class="user-info"></div><button class="btn" onclick="logout()">로그아웃</button>';area.firstChild.textContent=accountName+' · '+(accountBalance===null?accountWalletStatus:'계정 지갑 '+accountBalance.toLocaleString()+' 코인 (조회 전용)');return}
 title.textContent=mode==='login'?'로그인':'회원가입';area.innerHTML=`<div class="auth-form"><input id="authUser" type="email" autocomplete="username" placeholder="이메일"><input id="authPass" type="password" minlength="6" autocomplete="${mode==='login'?'current-password':'new-password'}" placeholder="비밀번호 (6자 이상)"><button id="authSubmit" class="btn" onclick="${mode==='login'?'login()':'signup()'}">${mode==='login'?'로그인':'회원가입'}</button><button class="btn secondary" onclick="googleLogin()">Google로 로그인</button><p id="authError" role="alert"></p></div><div class="auth-switch"><button onclick="renderAuth('${mode==='login'?'signup':'login'}')">${mode==='login'?'회원가입':'로그인'}</button></div><p class="rules">기존 아이디 계정은 새 이메일 계정과 별개입니다. 기존 코인은 자동으로 옮기거나 삭제하지 않습니다. 비밀번호는 Firebase 인증에서 처리하며 데이터베이스에 저장하지 않습니다.</p>`;
}
async function authenticate(fn){const btn=document.getElementById('authSubmit');if(btn)btn.disabled=true;try{await fn();closeAccount()}catch(e){const box=document.getElementById('authError');if(box)box.textContent=window.FormwheelUI?.errorMessage(e)||e.message;else reportWallet(e)}finally{if(btn)btn.disabled=false}}
function login(){return authenticate(()=>auth.signInWithEmailAndPassword(document.getElementById('authUser').value.trim(),document.getElementById('authPass').value))}
function signup(){return authenticate(()=>auth.createUserWithEmailAndPassword(document.getElementById('authUser').value.trim(),document.getElementById('authPass').value))}
function googleLogin(){return authenticate(()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()))}
async function logout(){if(walletBusy||(typeof bj!=='undefined'&&bj.active)){alert('거래가 끝난 뒤 로그아웃하세요.');return}await auth.signOut();closeAccount()}
renderWallet();
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function openGame(type){
 if(window.bj)window.bj.active=false;
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
function closeGame(){if(window.bj)window.bj.active=false;document.getElementById('game').classList.remove('active');}

function roulette(el){
 el.innerHTML='<div class="status" id="rmsg">0~36 숫자와 색을 관찰하세요.</div><div class="wheel"><span>FORM</span></div><button class="btn" onclick="spinRoulette()">돌리기</button><div class="rules">결과 관찰용이며 점수나 코인 변동이 없습니다.</div>';
}
function spinRoulette(){const n=Math.floor(Math.random()*37),red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];document.getElementById('rmsg').textContent=n+' · '+(n===0?'초록':red.includes(n)?'빨강':'검정');}
function blackjack(el){
 el.innerHTML='<div class="status" id="bmsg">21에 가까운 카드 합을 연습하세요.</div><div class="cards" id="bcards"></div><div class="controls"><button class="btn" id="deal" onclick="dealBJ()">Deal</button><button class="btn secondary" id="hit" onclick="hitBJ()" disabled>Hit</button><button class="btn secondary" id="stand" onclick="standBJ()" disabled>Stand</button></div><div class="rules">21을 넘지 않도록 연습합니다. 코인 변동은 없습니다.</div>';
 window.bj={active:false,player:[]};
}
const deckRanks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function card(){return deckRanks[Math.floor(Math.random()*deckRanks.length)]}
function val(cards){let s=0,a=0;cards.forEach(c=>{if(c==='A'){s+=11;a++}else s+=isNaN(+c)?10:+c});while(s>21&&a){s-=10;a--}return s}
function renderBJ(){document.getElementById('bcards').innerHTML=bj.player.map(x=>'<div class="playcard">'+x+'</div>').join('');document.getElementById('bmsg').textContent='현재 합: '+val(bj.player)}
function dealBJ(){if(bj.active)return;bj={active:true,player:[card(),card()]};renderBJ();document.getElementById('deal').disabled=true;document.getElementById('hit').disabled=false;document.getElementById('stand').disabled=false;if(val(bj.player)===21)standBJ()}
function hitBJ(){if(!bj.active)return;bj.player.push(card());renderBJ();if(val(bj.player)>=21)standBJ()}
function standBJ(){if(!bj.active)return;bj.active=false;document.getElementById('bmsg').textContent='연습 종료 · 카드 합 '+val(bj.player);document.getElementById('deal').disabled=false;document.getElementById('hit').disabled=true;document.getElementById('stand').disabled=true}
function dice(el){el.innerHTML='<div class="status" id="dmsg">두 주사위의 합을 관찰하세요.</div><button class="btn" onclick="rollDice()">굴리기</button>'}
function rollDice(){let a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);document.getElementById('dmsg').textContent=a+' + '+b+' = '+(a+b)}
function coin(el){el.innerHTML='<div class="status" id="cmsg">동전의 두 가지 결과를 관찰하세요.</div><button class="btn" onclick="flipCoin()">뒤집기</button>'}
function flipCoin(){document.getElementById('cmsg').textContent=Math.random()<.5?'앞면':'뒷면'}
function highlow(el){el.innerHTML='<div class="status" id="hmsg">두 카드의 크기를 비교하세요.</div><button class="btn" onclick="playHL()">카드 비교</button>'}
function playHL(){const a=1+Math.floor(Math.random()*13),b=1+Math.floor(Math.random()*13);document.getElementById('hmsg').textContent=a+' → '+b+' · '+(a===b?'같음':a<b?'높아짐':'낮아짐')}
function jackpot(el){el.innerHTML='<div class="status" id="jmsg">세 기호의 일치 여부를 관찰하세요.</div><div class="cards" id="slots"></div><button class="btn" onclick="spinJackpot()">기호 보기</button>'}
function spinJackpot(){const symbols=['🍒','🍋','⭐','7️⃣','💎'],a=Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]);document.getElementById('slots').textContent=a.join(' ');document.getElementById('jmsg').textContent='서로 다른 기호 '+new Set(a).size+'개'}
