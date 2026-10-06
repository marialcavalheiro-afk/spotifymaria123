import { db } from "./firebase.js";

import {
  ref,
  push,
  set,
  onValue,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const musicasRef = ref(db, "musicas");

let idEdicao = null;
let capaArquivoSelecionado = null;
let audioArquivoSelecionado = null;
let capaPreviewUrl = null;
let audioPreviewUrl = null;


/* BANCO LOCAL */

const DB_NAME = "spotify_clone_db";
const DB_VERSION = 1;
const STORE_NAME = "arquivos";

function abrirBancoLocal() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const banco = request.result;

      if (!banco.objectStoreNames.contains(STORE_NAME)) {
        banco.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function salvarArquivoLocal(id, arquivo) {
  const banco = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(STORE_NAME, "readwrite");
    const store = transacao.objectStore(STORE_NAME);
    const request = store.put(arquivo, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function buscarArquivoLocal(id) {
  const banco = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(STORE_NAME, "readonly");
    const store = transacao.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function excluirArquivoLocal(id) {
  const banco = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(STORE_NAME, "readwrite");
    const store = transacao.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}


/* NAVEGAÇÃO */

const btnNavPlayer = document.getElementById("btn-nav-player");
const btnNavAdmin = document.getElementById("btn-nav-admin");
const btnNavCadastro = document.getElementById("btn-nav-cadastro");

const secaoPlayer = document.getElementById("secao-player");
const secaoAdmin = document.getElementById("secao-admin");
const secaoCadastro = document.getElementById("secao-cadastro");

function alternarAba(abaAtiva, botaoAtivo) {
  [secaoPlayer, secaoAdmin, secaoCadastro].forEach(
    aba => aba.classList.add("oculto")
  );

  [btnNavPlayer, btnNavAdmin, btnNavCadastro].forEach(
    botao => botao.classList.remove("active")
  );

  abaAtiva.classList.remove("oculto");
  botaoAtivo.classList.add("active");
}

btnNavPlayer.addEventListener("click", () => {
  alternarAba(secaoPlayer, btnNavPlayer);
});

btnNavAdmin.addEventListener("click", () => {
  alternarAba(secaoAdmin, btnNavAdmin);
});

btnNavCadastro.addEventListener("click", () => {
  alternarAba(secaoCadastro, btnNavCadastro);
});


/* ELEMENTOS DO FORMULÁRIO */

const formMusica = document.getElementById("form-musica");

const tituloInput = document.getElementById("titulo");
const artistaInput = document.getElementById("artista");
const estiloInput = document.getElementById("estilo");
const duracaoInput = document.getElementById("duracao");

const capaInput = document.getElementById("capaArquivo");
const audioInput = document.getElementById("audioArquivo");

const btnEscolherCapa =
  document.getElementById("btn-escolher-capa");

const btnEscolherAudio =
  document.getElementById("btn-escolher-audio");

const previewCapa =
  document.getElementById("preview-capa");

const uploadCapaConteudo =
  document.getElementById("upload-capa-conteudo");

const nomeCapa =
  document.getElementById("nome-capa");

const nomeCapaTexto =
  document.getElementById("nome-capa-texto");

const nomeAudio =
  document.getElementById("nome-audio");

const tamanhoAudio =
  document.getElementById("tamanho-audio");

const btnSalvar =
  document.getElementById("btn-salvar");

const btnCancelar =
  document.getElementById("btn-cancelar");

const tituloFormulario =
  document.getElementById("titulo-formulario");


/* ESCOLHER CAPA */

btnEscolherCapa.addEventListener("click", () => {
  capaInput.click();
});

capaInput.addEventListener("change", () => {
  const arquivo = capaInput.files[0];

  if (!arquivo) return;

  if (!arquivo.type.startsWith("image/")) {
    alert("Selecione uma imagem válida.");
    capaInput.value = "";
    return;
  }

  capaArquivoSelecionado = arquivo;

  if (capaPreviewUrl) {
    URL.revokeObjectURL(capaPreviewUrl);
  }

  capaPreviewUrl = URL.createObjectURL(arquivo);

  previewCapa.src = capaPreviewUrl;
  previewCapa.classList.remove("oculto");
  uploadCapaConteudo.classList.add("oculto");

  nomeCapa.classList.remove("oculto");
  nomeCapaTexto.textContent = arquivo.name;
});


/* ESCOLHER ÁUDIO */

btnEscolherAudio.addEventListener("click", () => {
  audioInput.click();
});

audioInput.addEventListener("change", () => {
  const arquivo = audioInput.files[0];

  if (!arquivo) return;

  if (!arquivo.type.startsWith("audio/")) {
    alert("Selecione um arquivo de áudio válido.");
    audioInput.value = "";
    return;
  }

  audioArquivoSelecionado = arquivo;

  nomeAudio.textContent = arquivo.name;

  tamanhoAudio.textContent =
    `${formatarTamanho(arquivo.size)} • ${arquivo.type}`;
});

function formatarTamanho(bytes) {
  if (!bytes) return "0 Bytes";

  const unidades = ["Bytes", "KB", "MB", "GB"];
  const indice = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat(
    (bytes / Math.pow(1024, indice)).toFixed(2)
  )} ${unidades[indice]}`;
}


/* PLAYER */

async function tocarMusica(musica) {
  try {
    const audio = await buscarArquivoLocal(musica.audioId);
    const capa = await buscarArquivoLocal(musica.capaId);

    if (!audio) {
      alert(
        "O arquivo de áudio não está disponível neste navegador."
      );
      return;
    }

    const audioElement =
      document.getElementById("audio-element");

    const playerTitulo =
      document.getElementById("player-titulo");

    const playerArtista =
      document.getElementById("player-artista");

    const playerCapa =
      document.getElementById("player-capa");

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    audioPreviewUrl = URL.createObjectURL(audio);

    audioElement.src = audioPreviewUrl;

    playerTitulo.textContent = musica.titulo;
    playerArtista.textContent = musica.artista;

    if (capa) {
      if (capaPreviewUrl) {
        URL.revokeObjectURL(capaPreviewUrl);
      }

      capaPreviewUrl = URL.createObjectURL(capa);
      playerCapa.src = capaPreviewUrl;
    }

    await audioElement.play();

  } catch (erro) {
    console.error("Erro ao tocar música:", erro);
    alert("Não foi possível reproduzir esta música.");
  }
}


/* DOWNLOAD */

async function baixarMusica(musica) {
  try {
    const arquivo =
      await buscarArquivoLocal(musica.audioId);

    if (!arquivo) {
      alert(
        "O arquivo não está disponível neste navegador."
      );
      return;
    }

    const url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      arquivo.name || `${musica.titulo}.mp3`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

  } catch (erro) {
    console.error("Erro ao baixar:", erro);
    alert("Não foi possível baixar o arquivo.");
  }
}


/* PLAYER */

const listaPlayer =
  document.getElementById("lista-player");

const inputBusca =
  document.getElementById("busca");

let listaCompleta = [];

function renderizarMusicas(musicas) {
  listaPlayer.innerHTML = "";

  if (!musicas.length) {
    listaPlayer.innerHTML = `
      <div class="sem-musicas">
        <h2>Nenhuma música encontrada</h2>
        <p>Adicione músicas pelo painel administrativo.</p>
      </div>
    `;

    return;
  }

  musicas.forEach(musica => {
    const card = document.createElement("div");

    card.className = "card-musica";

    card.innerHTML = `
      <div class="capa-container">
        <div class="capa-placeholder">
          🎵
        </div>

        <button class="btn-play" type="button">
          ▶
        </button>
      </div>

      <div class="info">
        <h4>${musica.titulo}</h4>
        <p>${musica.artista}</p>
        <span class="genero">
          ${musica.estilo || ""}
        </span>
      </div>

      <button class="btn-download" type="button">
        ↓ Baixar
      </button>
    `;

    carregarCapaCard(musica, card);

    card.querySelector(".btn-play").addEventListener(
      "click",
      evento => {
        evento.stopPropagation();
        tocarMusica(musica);
      }
    );

    card.querySelector(".btn-download").addEventListener(
      "click",
      evento => {
        evento.stopPropagation();
        baixarMusica(musica);
      }
    );

    card.addEventListener("click", () => {
      tocarMusica(musica);
    });

    listaPlayer.appendChild(card);
  });
}

async function carregarCapaCard(musica, card) {
  try {
    const capa =
      await buscarArquivoLocal(musica.capaId);

    if (!capa) return;

    const container =
      card.querySelector(".capa-container");

    const imagem =
      document.createElement("img");

    imagem.src = URL.createObjectURL(capa);
    imagem.alt = `Capa de ${musica.titulo}`;

    const placeholder =
      container.querySelector(".capa-placeholder");

    if (placeholder) {
      placeholder.remove();
    }

    container.prepend(imagem);

  } catch (erro) {
    console.error("Erro ao carregar capa:", erro);
  }
}


/* REALTIME DATABASE */

onValue(
  musicasRef,
  snapshot => {
    const dados = snapshot.val() || {};

    listaCompleta = Object.entries(dados).map(
      ([id, musica]) => ({
        id,
        ...musica
      })
    );

    renderizarMusicas(listaCompleta);
    renderizarAdmin(listaCompleta);
  },
  erro => {
    console.error(
      "Erro ao carregar Realtime Database:",
      erro
    );

    listaPlayer.innerHTML = `
      <div class="sem-musicas">
        <h2>Erro ao carregar músicas</h2>
        <p>Verifique o console do navegador.</p>
      </div>
    `;
  }
);


/* BUSCA */

inputBusca.addEventListener("input", evento => {
  const termo =
    evento.target.value.toLowerCase().trim();

  const filtradas = listaCompleta.filter(musica => {
    const titulo =
      (musica.titulo || "").toLowerCase();

    const artista =
      (musica.artista || "").toLowerCase();

    const estilo =
      (musica.estilo || "").toLowerCase();

    return (
      titulo.includes(termo) ||
      artista.includes(termo) ||
      estilo.includes(termo)
    );
  });

  renderizarMusicas(filtradas);
});


/* SALVAR MÚSICA */

formMusica.addEventListener(
  "submit",
  async evento => {
    evento.preventDefault();

    const titulo =
      tituloInput.value.trim();

    const artista =
      artistaInput.value.trim();

    const estilo =
      estiloInput.value.trim();

    const duracao =
      duracaoInput.value.trim();

    if (!titulo || !artista || !estilo || !duracao) {
      alert("Preencha todos os campos.");
      return;
    }

    if (!idEdicao) {
      if (!capaArquivoSelecionado) {
        alert("Escolha uma capa para a música.");
        return;
      }

      if (!audioArquivoSelecionado) {
        alert("Escolha o arquivo de áudio.");
        return;
      }
    }

    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando...";

      const dados = {
        titulo,
        artista,
        estilo,
        duracao
      };


      /* EDITAR */

      if (idEdicao) {
        const musicaAtual =
          listaCompleta.find(
            musica => musica.id === idEdicao
          );

        if (!musicaAtual) {
          alert("Música não encontrada.");
          return;
        }

        if (capaArquivoSelecionado) {
          const capaId = `capa_${idEdicao}`;

          await salvarArquivoLocal(
            capaId,
            capaArquivoSelecionado
          );

          dados.capaId = capaId;
        } else {
          dados.capaId = musicaAtual.capaId;
        }

        if (audioArquivoSelecionado) {
          const audioId = `audio_${idEdicao}`;

          await salvarArquivoLocal(
            audioId,
            audioArquivoSelecionado
          );

          dados.audioId = audioId;
        } else {
          dados.audioId = musicaAtual.audioId;
        }

        await update(
          ref(db, `musicas/${idEdicao}`),
          dados
        );

        alert("Música atualizada com sucesso!");
      }


      /* ADICIONAR */

      else {
        const novaMusicaRef =
          push(musicasRef);

        const id = novaMusicaRef.key;

        const capaId = `capa_${id}`;
        const audioId = `audio_${id}`;

        await salvarArquivoLocal(
          capaId,
          capaArquivoSelecionado
        );

        await salvarArquivoLocal(
          audioId,
          audioArquivoSelecionado
        );

        await set(
          novaMusicaRef,
          {
            ...dados,
            capaId,
            audioId
          }
        );

        alert("Música adicionada com sucesso!");
      }

      limparFormulario();

    } catch (erro) {
      console.error("Erro ao salvar:", erro);

      alert(
        "Erro ao salvar a música. Verifique o Console."
      );

    } finally {
      btnSalvar.disabled = false;

      btnSalvar.textContent = idEdicao
        ? "Atualizar música"
        : "+ Adicionar música";
    }
  }
);


/* RENDERIZAR ADMIN */

const listaAdmin =
  document.getElementById("lista-admin");

const contadorMusicas =
  document.getElementById("contador-musicas");

function renderizarAdmin(musicas) {
  listaAdmin.innerHTML = "";

  contadorMusicas.textContent =
    `${musicas.length} ${
      musicas.length === 1
        ? "música"
        : "músicas"
    }`;

  if (!musicas.length) {
    listaAdmin.innerHTML = `
      <tr>
        <td colspan="6" class="tabela-vazia">
          Nenhuma música cadastrada.
        </td>
      </tr>
    `;

    return;
  }

  musicas.forEach(musica => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="mini-capa">
          🎵
        </div>
      </td>

      <td>
        <div class="nome-musica-tabela">
          <strong>${musica.titulo}</strong>
        </div>
      </td>

      <td>${musica.artista}</td>

      <td>
        <span class="badge-genero">
          ${musica.estilo}
        </span>
      </td>

      <td>${musica.duracao}</td>

      <td>
        <div class="acoes">
          <button
            class="btn-acao btn-tocar"
            type="button"
          >
            ▶
          </button>

          <button
            class="btn-acao btn-editar"
            type="button"
          >
            Editar
          </button>

          <button
            class="btn-acao btn-excluir"
            type="button"
          >
            Excluir
          </button>
        </div>
      </td>
    `;

    carregarMiniCapa(musica, tr);

    tr.querySelector(".btn-tocar").addEventListener(
      "click",
      () => tocarMusica(musica)
    );

    tr.querySelector(".btn-editar").addEventListener(
      "click",
      () => editarMusica(musica)
    );

    tr.querySelector(".btn-excluir").addEventListener(
      "click",
      () => excluirMusica(musica)
    );

    listaAdmin.appendChild(tr);
  });
}

async function carregarMiniCapa(musica, tr) {
  try {
    const capa =
      await buscarArquivoLocal(musica.capaId);

    if (!capa) return;

    const container =
      tr.querySelector(".mini-capa");

    const imagem =
      document.createElement("img");

    imagem.src = URL.createObjectURL(capa);
    imagem.alt = `Capa de ${musica.titulo}`;

    container.innerHTML = "";
    container.appendChild(imagem);

  } catch (erro) {
    console.error(
      "Erro ao carregar mini capa:",
      erro
    );
  }
}


/* EDITAR */

function editarMusica(musica) {
  tituloInput.value = musica.titulo || "";
  artistaInput.value = musica.artista || "";
  estiloInput.value = musica.estilo || "";
  duracaoInput.value = musica.duracao || "";

  idEdicao = musica.id;

  capaArquivoSelecionado = null;
  audioArquivoSelecionado = null;

  capaInput.value = "";
  audioInput.value = "";

  tituloFormulario.textContent = "Editar música";
  btnSalvar.textContent = "Atualizar música";

  btnCancelar.classList.remove("oculto");

  nomeCapa.classList.add("oculto");

  nomeAudio.textContent =
    "Nenhum arquivo selecionado";

  tamanhoAudio.textContent =
    "Escolha um novo áudio somente se quiser substituir.";

  carregarCapaEdicao(musica);

  alternarAba(secaoAdmin, btnNavAdmin);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function carregarCapaEdicao(musica) {
  try {
    const capa =
      await buscarArquivoLocal(musica.capaId);

    if (!capa) {
      previewCapa.classList.add("oculto");
      uploadCapaConteudo.classList.remove("oculto");
      return;
    }

    if (capaPreviewUrl) {
      URL.revokeObjectURL(capaPreviewUrl);
    }

    capaPreviewUrl = URL.createObjectURL(capa);

    previewCapa.src = capaPreviewUrl;

    previewCapa.classList.remove("oculto");
    uploadCapaConteudo.classList.add("oculto");

    nomeCapa.classList.remove("oculto");
    nomeCapaTexto.textContent = capa.name;

  } catch (erro) {
    console.error(
      "Erro ao carregar capa:",
      erro
    );
  }
}


/* EXCLUIR */

async function excluirMusica(musica) {
  const confirmar = confirm(
    `Deseja excluir "${musica.titulo}"?`
  );

  if (!confirmar) return;

  try {
    await remove(
      ref(db, `musicas/${musica.id}`)
    );

    await excluirArquivoLocal(
      musica.capaId
    );

    await excluirArquivoLocal(
      musica.audioId
    );

    alert("Música excluída com sucesso!");

  } catch (erro) {
    console.error(
      "Erro ao excluir:",
      erro
    );

    alert("Erro ao excluir a música.");
  }
}


/* CANCELAR EDIÇÃO */

btnCancelar.addEventListener("click", () => {
  limparFormulario();
});


/* LIMPAR FORMULÁRIO */

function limparFormulario() {
  formMusica.reset();

  idEdicao = null;

  capaArquivoSelecionado = null;
  audioArquivoSelecionado = null;

  tituloFormulario.textContent =
    "Adicionar música";

  btnSalvar.textContent =
    "+ Adicionar música";

  btnCancelar.classList.add("oculto");

  previewCapa.classList.add("oculto");

  uploadCapaConteudo.classList.remove("oculto");

  nomeCapa.classList.add("oculto");

  nomeCapaTexto.textContent = "";

  nomeAudio.textContent =
    "Nenhum arquivo selecionado";

  tamanhoAudio.textContent =
    "Escolha um arquivo MP3 ou outro áudio";

  if (capaPreviewUrl) {
    URL.revokeObjectURL(capaPreviewUrl);
    capaPreviewUrl = null;
  }
}


/* CADASTRO */

const formCadastro =
  document.getElementById("form-cadastro");

formCadastro.addEventListener(
  "submit",
  evento => {
    evento.preventDefault();

    const email =
      document.getElementById("email").value;

    alert(
      `Cadastro recebido para ${email}.`
    );

    formCadastro.reset();
  }
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("PWA ativada"))
      .catch(erro => console.error("Erro na PWA:", erro));
  });
}

