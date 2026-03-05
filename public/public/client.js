const socket = io();
const $ = (id)=>document.getElementById(id);

let code=null, playerId=null, state=null, myRole=null;

function toast(msg){
  const t=$("toast");
  t.textContent=msg;
  t.classList.remove("hidden");
  setTimeout(()=>t.classList.add("hidden"), 1800);
}

function showRoom(){
  $("home").classList.add("hidden");
  $("room").classList.remove("hidden");
}

function render(st){
  state=st;
  $("roomCode").textContent = st.code || "—";
  $("hostPanel").classList.toggle("hidden", !(st.hostId===playerId && st.phase==="lobby"));

  // players
  const pbox=$("players"); pbox.innerHTML="";
  st.players.forEach(p=>{
    const d=document.createElement("div");
    d.className="pill";
    d.innerHTML=`<span>${p.name} ${p.alive?"":"(out)"}</span><span class="mono">${p.isHost?"HOST":""}</span>`;
    pbox.appendChild(d);
  });

  // clues
  const cbox=$("clues"); cbox.innerHTML="";
  st.clues.forEach(c=>{
    const d=document.createElement("div");
    d.className="pill";
    d.innerHTML=`<span><b>${c.name}</b> : ${c.text}</span>`;
    cbox.appendChild(d);
  });

  // vote list
  const vbox=$("vote"); vbox.innerHTML="";
  st.players.filter(p=>p.alive && p.id!==playerId).forEach(p=>{
    const d=document.createElement("div");
    d.className="pill";
    d.innerHTML=`<span>${p.name}</span><button class="primary">Voter</button>`;
    d.querySelector("button").onclick=()=>{
      socket.emit("cast_vote",{code, playerId, targetId:p.id});
      toast("Vote envoyé ✅");
    };
    vbox.appendChild(d);
  });

  $("btnResolve").classList.toggle("hidden", st.hostId!==playerId);
}

$("btnJoinToggle").onclick=()=> $("joinRow").classList.toggle("hidden");

$("btnCreate").onclick=()=>{
  const name=$("name").value.trim();
  if(!name) return toast("Entre ton prénom");
  socket.emit("create_game",{name});
};

$("btnJoin").onclick=()=>{
  const name=$("name").value.trim();
  const joinCode=$("joinCode").value.trim().toUpperCase();
  if(!name) return toast("Entre ton prénom");
  if(!joinCode) return toast("Entre un code");
  socket.emit("join_game",{code:joinCode, name});
};

$("btnStart").onclick=()=>{
  socket.emit("start_game",{code, playerId});
};

$("btnClue").onclick=()=>{
  const text=$("clueInput").value.trim();
  if(!text) return toast("Écris un indice");
  socket.emit("submit_clue",{code, playerId, text});
  $("clueInput").value="";
  toast("Indice envoyé ✅");
};

$("btnResolve").onclick=()=>{
  socket.emit("resolve_vote",{code, playerId});
};

socket.on("created", ({code:c, playerId:p})=>{
  code=c; playerId=p;
  showRoom();
  toast("Partie créée ✅");
});

socket.on("joined", ({code:c, playerId:p})=>{
  code=c; playerId=p;
  showRoom();
  toast("Partie rejointe ✅");
});

socket.on("state", (st)=> render(st));

socket.on("private_role", ({role, word})=>{
  myRole=role;
  $("myRole").textContent = role==="civil"?"👨 Civil":role==="undercover"?"🕵️ Undercover":"🤫 Mr White";
  $("myWord").textContent = role==="mrwhite" ? "Pas de mot. Écoute & improvise." : `Ton mot : ${word}`;
});

socket.on("reveal_elimination", (info)=>{
  toast(`${info.name} éliminé (${info.role})`);
});

socket.on("error_msg", (m)=>toast(m));
