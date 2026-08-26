const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5000;
const PUBLIC = path.join(__dirname, "public");

const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";
const sessions = new Set();

let products = [
  {id:1,title:"Excellence in Science",subject:"Science",stage:"Secondary",grade:"Grade 3 Secondary",price:170,oldPrice:200,discount:15,stock:25,icon:"⚛",description:"Complete Science revision book with summaries, exercises and final exam training."},
  {id:2,title:"Alfa Science",subject:"Science",stage:"Preparatory",grade:"Grade 2 Preparatory",price:180,oldPrice:210,discount:10,stock:18,icon:"🔬",description:"Organized Science lessons for preparatory students with practice questions."},
  {id:3,title:"Mega Science",subject:"Science",stage:"Primary",grade:"Grade 6 Primary",price:150,oldPrice:190,discount:20,stock:30,icon:"🧬",description:"Simple Science book for primary students with colorful activities."},
  {id:4,title:"Exam in Chemistry",subject:"Chemistry",stage:"Secondary",grade:"Grade 3 Secondary",price:225,oldPrice:260,discount:10,stock:12,icon:"⚗",description:"Chemistry exam-focused book with equations and model answers."},
  {id:5,title:"Legend Chemistry",subject:"Chemistry",stage:"Secondary",grade:"Grade 3 Secondary",price:170,oldPrice:200,discount:15,stock:16,icon:"🧪",description:"Premium Chemistry notes, revision, experiments and exercises."},
  {id:6,title:"Alfa Chemistry",subject:"Chemistry",stage:"Preparatory",grade:"Grade 2 Preparatory",price:180,oldPrice:210,discount:10,stock:22,icon:"⚗",description:"Chemistry basics explained in a clean and simple way."},
  {id:7,title:"Primary Science Kit",subject:"Science",stage:"Primary",grade:"Grade 4 Primary",price:120,oldPrice:150,discount:12,stock:40,icon:"🔭",description:"Fun learning kit for primary science with activities and tests."},
  {id:8,title:"Chemistry Lab Notes",subject:"Chemistry",stage:"Secondary",grade:"Grade 2 Secondary",price:160,oldPrice:190,discount:10,stock:15,icon:"🥼",description:"Lab notes, experiments, Chemistry exercises and quick revision."}
];

let orders = [];

function send(res, code, data, type="application/json; charset=utf-8"){
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(typeof data === "string" || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2));
}
function readBody(req){
  return new Promise(resolve=>{
    let d="";
    req.on("data", c=>d+=c);
    req.on("end", ()=>{
      try{ resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); }
    });
  });
}
function tokenFrom(req){ return (req.headers.authorization || "").replace("Bearer ","").trim(); }
function isAuthed(req){ return sessions.has(tokenFrom(req)); }
function requireAuth(req,res){
  if(!isAuthed(req)){ send(res,401,{error:"Unauthorized"}); return false; }
  return true;
}

const mimes = {
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8"
};

http.createServer(async (req,res)=>{
  if(req.method === "OPTIONS") return send(res,204,"");
  const url = new URL(req.url, `http://${req.headers.host}`);

  if(url.pathname === "/api/login" && req.method === "POST"){
    const b = await readBody(req);
    if(b.username === ADMIN_USER && b.password === ADMIN_PASS){
      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      return send(res,200,{token,user:ADMIN_USER});
    }
    return send(res,401,{error:"Wrong username or password"});
  }

  if(url.pathname === "/api/me" && req.method === "GET"){
    if(!requireAuth(req,res)) return;
    return send(res,200,{user:ADMIN_USER});
  }

  if(url.pathname === "/api/products" && req.method === "GET"){
    let list = [...products];
    const subject = url.searchParams.get("subject");
    const stage = url.searchParams.get("stage");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    if(subject && subject !== "All") list = list.filter(p=>p.subject === subject);
    if(stage && stage !== "All") list = list.filter(p=>p.stage === stage);
    if(q) list = list.filter(p=>(p.title+p.subject+p.stage+p.grade+p.description).toLowerCase().includes(q));
    return send(res,200,list);
  }

  if(url.pathname === "/api/products" && req.method === "POST"){
    if(!requireAuth(req,res)) return;
    const b = await readBody(req);
    const p = {
      id: Date.now(),
      title: b.title || "New Book",
      subject: b.subject || "Science",
      stage: b.stage || "Primary",
      grade: b.grade || "Grade 1",
      price: Number(b.price || 100),
      oldPrice: Number(b.oldPrice || 0),
      discount: Number(b.discount || 0),
      stock: Number(b.stock || 0),
      icon: b.icon || (b.subject === "Chemistry" ? "⚗" : "⚛"),
      description: b.description || "Book description"
    };
    products.unshift(p);
    return send(res,201,p);
  }

  if(url.pathname.startsWith("/api/products/") && req.method === "PUT"){
    if(!requireAuth(req,res)) return;
    const id = Number(url.pathname.split("/").pop());
    const b = await readBody(req);
    products = products.map(p=>p.id===id ? {
      ...p, ...b, id,
      price: Number(b.price ?? p.price),
      oldPrice: Number(b.oldPrice ?? p.oldPrice),
      discount: Number(b.discount ?? p.discount),
      stock: Number(b.stock ?? p.stock)
    } : p);
    return send(res,200,products.find(p=>p.id===id));
  }

  if(url.pathname.startsWith("/api/products/") && req.method === "DELETE"){
    if(!requireAuth(req,res)) return;
    const id = Number(url.pathname.split("/").pop());
    products = products.filter(p=>p.id!==id);
    return send(res,200,{ok:true});
  }

  if(url.pathname === "/api/orders" && req.method === "GET"){
    if(!requireAuth(req,res)) return;
    return send(res,200,orders);
  }

  if(url.pathname === "/api/orders" && req.method === "POST"){
    const b = await readBody(req);
    const order = {id:Date.now(),status:"New",date:new Date().toISOString(),...b};
    orders.unshift(order);
    return send(res,201,order);
  }

  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const f = path.normalize(path.join(PUBLIC,file));
  if(!f.startsWith(PUBLIC)) return send(res,403,"Forbidden","text/plain");
  fs.readFile(f,(err,data)=>{
    if(err) return send(res,404,"Not found","text/plain; charset=utf-8");
    send(res,200,data,mimes[path.extname(f)] || "application/octet-stream");
  });
}).listen(PORT,()=>console.log(`Emo Store Final running on http://localhost:${PORT}`));