(function(root){
 const catalog={ocean:{name:'바다 배경',price:120,type:'background',value:'#e0f2fe'},rose:{name:'장미 배경',price:120,type:'background',value:'#fff1f2'},star:{name:'별 이름 장식',price:80,type:'decoration',value:'⭐'},crown:{name:'왕관 이름 장식',price:200,type:'decoration',value:'👑'}};
 function initial(today){return{version:2,coins:100,lastDaily:today,inventory:{},equipped:{},ledger:{}}}
 function apply(wallet,op){
  if(!wallet||wallet.version!==2||!Number.isSafeInteger(wallet.coins)||wallet.coins<0)throw new Error('잘못된 지갑 데이터');
  if(!op.id||!Number.isFinite(op.at))throw new Error('잘못된 거래');
  if(wallet.ledger?.[op.id])return wallet;
  const next=JSON.parse(JSON.stringify(wallet));next.ledger??={};next.inventory??={};next.equipped??={};let delta=0,label='';
  if(op.type==='daily'){if(next.lastDaily===op.day)return wallet;delta=100;label='일일 지급';next.lastDaily=op.day}
  else if(op.type==='purchase'){const item=catalog[op.item];if(!item)throw new Error('없는 상품');if(next.inventory[op.item])throw new Error('이미 보유한 상품');delta=-item.price;label=item.name+' 구매';next.inventory[op.item]=true}
  else if(op.type==='equip'){const item=catalog[op.item];if(!item||!next.inventory[op.item])throw new Error('보유하지 않은 상품');next.equipped[item.type]=op.item;label=item.name+' 적용'}
  else if(op.type==='game'){if(!Number.isSafeInteger(op.delta)||Math.abs(op.delta)>1000000)throw new Error('잘못된 코인 금액');delta=op.delta;label=String(op.label||'게임').slice(0,80)}
  else throw new Error('지원하지 않는 거래');
  if(next.coins+delta<0)throw new Error('코인이 부족합니다');next.coins+=delta;next.ledger[op.id]={at:op.at,type:op.type,delta,balance:next.coins,label};
  // Keep last 200 records; old receipts must not be replayed by a trusted server.
  const ids=Object.keys(next.ledger).sort((a,b)=>next.ledger[b].at-next.ledger[a].at);for(const id of ids.slice(200))delete next.ledger[id];return next;
 }
 root.FormwheelWallet={catalog,initial,apply};
})(typeof window==='undefined'?globalThis:window);
