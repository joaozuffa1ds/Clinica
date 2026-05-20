/* SENHA E TABELA */
const senha = "14162130";
const tabela = document.querySelector("#tabela tbody");

/* FIREBASE CONFIG (Modular v9+) */
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQ-2MpZfu5DHfHrEZSfnK3-6Prd9JEiRk",
  authDomain: "pages-31d20.firebaseapp.com",
  projectId: "pages-31d20",
  storageBucket: "pages-31d20.firebasestorage.app",
  messagingSenderId: "128445095739",
  appId: "1:128445095739:web:7dde6890b00e4b6e2ba11e",
  measurementId: "G-X2N7S45SXP"
};

// Inicializar serviços
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioLogado = null;
let carregandoLogin = false;

/* LOGIN GOOGLE */
function loginGoogle(){
  if(carregandoLogin) return;
  carregandoLogin = true;

  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
      usuarioLogado = result.user;
      document.getElementById("usuario").innerText = "Logado como: " + usuarioLogado.email;
      carregar();
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    })
    .finally(() => {
      carregandoLogin = false;
    });
}
window.loginGoogle = loginGoogle;

/* EDITAR */
function editar(botao){
  const linha = botao.parentElement.parentElement;

  if(botao.textContent === "Editar"){
    const s = prompt("Digite a senha para editar:");

    if(s === senha){
      linha.querySelectorAll("td").forEach((td, i) => {
        if(i < 6) td.contentEditable = "true";
      });
      botao.textContent = "Salvar";
    } else {
      alert("Senha incorreta!");
    }
  } else {
    linha.querySelectorAll("td").forEach((td, i) => {
      if(i < 6) td.contentEditable = "false";
    });
    botao.textContent = "Editar";
    salvar();
  }
}
window.editar = editar;

/* REMOVER */
function remover(botao){
  const s = prompt("Digite a senha para excluir:");

  if(s === senha){
    if(confirm("Deseja realmente excluir?")){
      botao.parentElement.parentElement.remove();
      salvar();
    }
  } else {
    alert("Senha incorreta!");
  }
}
window.remover = remover;

/* SALVAR FIRESTORE */
async function salvar(){
  if(!usuarioLogado) return;

  const dados = [];
  tabela.querySelectorAll("tr").forEach(linha => {
    const col = linha.querySelectorAll("td");

    if(col.length >= 6){
      dados.push({
        nome: col[0].innerText.trim(),
        telefone: col[1].innerText.trim(),
        cpf: col[2].innerText.trim(),
        rg: col[3].innerText.trim(),
        obs: col[4].innerText.trim(),
        tratamento: col[5].innerText.trim()
      });
    }
  });

  try {
    await setDoc(doc(db, "fichas", usuarioLogado.uid), {
      pacientes: dados
    });
  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
}

/* CARREGAR FIRESTORE */
async function carregar(){
  if(!usuarioLogado) return;

  try {
    const docRef = doc(db, "fichas", usuarioLogado.uid);
    const docSnap = await getDoc(docRef);

    tabela.innerHTML = "";

    if(docSnap.exists()){
      const dados = docSnap.data().pacientes || [];

      dados.forEach(d => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
          <td contenteditable="false">${d.nome}</td>
          <td contenteditable="false">${d.telefone}</td>
          <td contenteditable="false">${d.cpf}</td>
          <td contenteditable="false">${d.rg}</td>
          <td contenteditable="false">${d.obs}</td>
          <td contenteditable="false">${d.tratamento}</td>
          <td>
            <button onclick="editar(this)">Editar</button>
            <button class="pdf" onclick="gerarPDFPaciente(this)">PDF</button>
            <button class="excluir" onclick="remover(this)">Excluir</button>
          </td>
        `;
        tabela.appendChild(linha);
      });
    }
  } catch (error) {
    console.error("Erro ao carregar:", error);
  }
}

/* ORDENAR */
function ordenar(){
  const linhas = Array.from(tabela.querySelectorAll("tr"));

  linhas.sort((a, b) =>
    a.children[0].innerText.toLowerCase().localeCompare(b.children[0].innerText.toLowerCase())
  );

  tabela.innerHTML = "";
  linhas.forEach(linha => tabela.appendChild(linha));
  salvar();
}
window.ordenar = ordenar;

/* PDF INDIVIDUAL */
function gerarPDFPaciente(botao){
  const linha = botao.parentElement.parentElement;
  const col = linha.querySelectorAll("td");

  const nome = col[0].innerText;
  const telefone = col[1].innerText;
  const cpf = col[2].innerText;
  const rg = col[3].innerText;
  const obs = col[4].innerText;
  const tratamento = col[5].innerText;

  const janela = window.open('', '', 'width=800,height=700');

  janela.document.write(`
    <html>
    <head>
      <title>Ficha do Paciente</title>
      <style>
        body { font-family: Arial; padding: 30px; background: #f2f2f2; }
        .card { background: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
        h1 { text-align: center; color: #2196f3; }
        p { font-size: 18px; margin: 15px 0; }
        strong { color: #1976d2; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Ficha do Paciente</h1>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>CPF:</strong> ${cpf}</p>
        <p><strong>RG:</strong> ${rg}</p>
        <p><strong>Observação:</strong> ${obs}</p>
        <p><strong>Tratamento:</strong> ${tratamento}</p>
      </div>
    </body>
    </html>
  `);

  janela.document.close();
  janela.print();
}
window.gerarPDFPaciente = gerarPDFPaciente;