const entregas = [
  { id: "E001", cidade: "São Paulo", regiao: "Sudeste", transportadora: "Rápido Sul", prazo: 3, diasReais: 4 },
  { id: "E002", cidade: "Rio de Janeiro", regiao: "Sudeste", transportadora: "LogMax", prazo: 4, diasReais: 4 },
  { id: "E003", cidade: "Recife", regiao: "Nordeste", transportadora: "Nordeste Express", prazo: 5, diasReais: 8 },
  { id: "E004", cidade: "Manaus", regiao: "Norte", transportadora: "Amazon Cargo", prazo: 7, diasReais: 10 },
  { id: "E005", cidade: "Curitiba", regiao: "Sul", transportadora: "Rápido Sul", prazo: 3, diasReais: 3 },
  { id: "E006", cidade: "Goiânia", regiao: "Centro-Oeste", transportadora: "Brasil Fretes", prazo: 5, diasReais: 7 },
  { id: "E007", cidade: "Salvador", regiao: "Nordeste", transportadora: "Nordeste Express", prazo: 5, diasReais: 6 },
  { id: "E008", cidade: "Belém", regiao: "Norte", transportadora: "Amazon Cargo", prazo: 8, diasReais: 12 },
  { id: "E009", cidade: "Porto Alegre", regiao: "Sul", transportadora: "Rápido Sul", prazo: 4, diasReais: 5 },
  { id: "E010", cidade: "Brasília", regiao: "Centro-Oeste", transportadora: "Brasil Fretes", prazo: 4, diasReais: 4 }
];

let graficoTransportadora;
let graficoRegiao;
let graficoStatus;
let graficoRanking;
let dadosAtuais = [...entregas];

Chart.defaults.color = "#cbd5e1";
Chart.defaults.font.family = "Arial";

/**
 * Remove acentos e transforma o texto em minúsculas.
 * Isso permite buscar "belem" e encontrar "Belém".
 */
function normalizarTexto(texto) {
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Calcula quantos dias uma entrega atrasou.
 * Se não houve atraso, retorna zero.
 */
function atraso(entrega) {
  return Math.max(0, entrega.diasReais - entrega.prazo);
}

/**
 * Classifica a entrega de acordo com a quantidade de dias de atraso.
 */
function statusEntrega(entrega) {
  const dias = atraso(entrega);

  if (dias === 0) return "No prazo";
  if (dias <= 2) return "Atenção";
  return "Crítico";
}

/**
 * Preenche automaticamente os filtros de região e transportadora.
 */
function popularFiltros() {
  const regioes = [...new Set(entregas.map(e => e.regiao))];
  const transportadoras = [...new Set(entregas.map(e => e.transportadora))];

  regioes.forEach(regiao => {
    const opt = document.createElement("option");
    opt.value = regiao;
    opt.textContent = regiao;
    document.getElementById("filtroRegiao").appendChild(opt);
  });

  transportadoras.forEach(transportadora => {
    const opt = document.createElement("option");
    opt.value = transportadora;
    opt.textContent = transportadora;
    document.getElementById("filtroTransportadora").appendChild(opt);
  });
}

/**
 * Aplica os filtros selecionados e a busca rápida.
 * A busca funciona por ID, cidade, região ou transportadora.
 */
function obterDadosFiltrados() {
  const regiao = document.getElementById("filtroRegiao").value;
  const transportadora = document.getElementById("filtroTransportadora").value;
  const busca = normalizarTexto(document.getElementById("busca").value);

  return entregas.filter(e => {
    const okRegiao = regiao === "Todas" || e.regiao === regiao;
    const okTransportadora = transportadora === "Todas" || e.transportadora === transportadora;

    const textoPesquisavel = normalizarTexto(`
      ${e.id}
      ${e.cidade}
      ${e.regiao}
      ${e.transportadora}
    `);

    const okBusca = textoPesquisavel.includes(busca);

    return okRegiao && okTransportadora && okBusca;
  });
}

/**
 * Agrupa os dados somando os dias de atraso por uma chave.
 * Exemplo: somar atrasos por região ou por transportadora.
 */
function agruparSoma(lista, chave) {
  return lista.reduce((acc, item) => {
    const nome = item[chave];
    acc[nome] = (acc[nome] || 0) + atraso(item);
    return acc;
  }, {});
}

/**
 * Atualiza os cards principais do dashboard.
 */
function atualizarCards(dados) {
  const total = dados.length;
  const atrasadas = dados.filter(e => atraso(e) > 0).length;
  const taxa = total ? Math.round((atrasadas / total) * 100) : 0;
  const maior = total ? Math.max(...dados.map(e => atraso(e))) : 0;

  document.getElementById("totalEntregas").textContent = total;
  document.getElementById("totalAtrasadas").textContent = atrasadas;
  document.getElementById("taxaAtraso").textContent = taxa + "%";
  document.getElementById("maiorAtraso").textContent = maior + " dias";
}

/**
 * Gera um texto automático com o principal insight do filtro atual.
 */
function atualizarInsightAutomatico(dados) {
  if (dados.length === 0) {
    document.getElementById("insightAutomatico").textContent =
      "Nenhuma entrega encontrada com os filtros atuais.";
    return;
  }

  const atrasadas = dados.filter(e => atraso(e) > 0);
  const taxa = Math.round((atrasadas.length / dados.length) * 100);
  const maisCritica = [...dados].sort((a, b) => atraso(b) - atraso(a))[0];

  const porRegiao = agruparSoma(dados, "regiao");
  const regiaoCritica = Object.entries(porRegiao).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("insightAutomatico").textContent =
    `Foram analisadas ${dados.length} entregas. ${atrasadas.length} estão atrasadas, ` +
    `gerando uma taxa de atraso de ${taxa}%. A entrega mais crítica é ${maisCritica.id}, ` +
    `em ${maisCritica.cidade}, com ${atraso(maisCritica)} dias de atraso. ` +
    `A região com maior soma de atraso é ${regiaoCritica[0]}.`;
}

/**
 * Atualiza a tabela com as entregas filtradas.
 * A tabela é ordenada do maior atraso para o menor atraso.
 */
function atualizarTabela(dados) {
  const tbody = document.getElementById("tabelaEntregas");
  tbody.innerHTML = "";

  const ordenados = [...dados].sort((a, b) => atraso(b) - atraso(a));

  ordenados.forEach(e => {
    const dias = atraso(e);
    const status = statusEntrega(e);

    let classe = "ok";
    if (status === "Atenção") classe = "alerta";
    if (status === "Crítico") classe = "critico";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.cidade}</td>
      <td>${e.regiao}</td>
      <td>${e.transportadora}</td>
      <td>${e.prazo} dias</td>
      <td>${e.diasReais} dias</td>
      <td>${dias} dias</td>
      <td><span class="badge ${classe}">${status}</span></td>
    `;

    tr.addEventListener("click", () => {
      abrirModal(
        `Entrega ${e.id}`,
        `A entrega para ${e.cidade}, na região ${e.regiao}, foi realizada pela transportadora ${e.transportadora}. ` +
        `O prazo previsto era de ${e.prazo} dias e o tempo real foi de ${e.diasReais} dias. ` +
        `O atraso calculado foi de ${dias} dias. Status: ${status}.`
      );
    });

    tbody.appendChild(tr);
  });
}

/**
 * Remove um gráfico antigo antes de redesenhar.
 * Isso evita sobreposição quando os filtros mudam.
 */
function destruirGrafico(grafico) {
  if (grafico) grafico.destroy();
}

/**
 * Cria gráficos de barra usando Chart.js.
 */
function criarGraficoBarra(elemento, labels, valores, titulo, horizontal = false) {
  return new Chart(elemento, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: titulo,
        data: valores,
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: () => {
              return "Use este dado para interpretar o dashboard.";
            }
          }
        },
        legend: {
          labels: {
            color: "#f8fafc"
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,.08)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,.08)" }
        }
      },
      onClick: (event, elements) => {
        if (!elements.length) return;

        const index = elements[0].index;

        abrirModal(
          labels[index],
          `Este item soma ${valores[index]} dias de atraso no conjunto filtrado. ` +
          `Quanto maior esse valor, maior a prioridade operacional para investigação.`
        );
      }
    }
  });
}

/**
 * Cria o gráfico de status das entregas.
 */
function criarGraficoStatus(elemento, noPrazo, atrasadas) {
  return new Chart(elemento, {
    type: "doughnut",
    data: {
      labels: ["No prazo", "Atrasadas"],
      datasets: [{
        data: [noPrazo, atrasadas],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: context => {
              const total = noPrazo + atrasadas;
              const valor = context.raw;
              const perc = total ? Math.round((valor / total) * 100) : 0;
              return `${context.label}: ${valor} entregas (${perc}%)`;
            }
          }
        },
        legend: {
          labels: {
            color: "#f8fafc"
          }
        }
      },
      onClick: () => {
        abrirModal(
          "Status das entregas",
          "O gráfico mostra a proporção entre entregas no prazo e entregas atrasadas."
        );
      }
    }
  });
}

/**
 * Atualiza todos os gráficos do dashboard.
 */
function atualizarGraficos(dados) {
  destruirGrafico(graficoTransportadora);
  destruirGrafico(graficoRegiao);
  destruirGrafico(graficoStatus);
  destruirGrafico(graficoRanking);

  const atrasoTransportadora = agruparSoma(dados, "transportadora");
  const atrasoRegiao = agruparSoma(dados, "regiao");

  const ranking = [...dados]
    .filter(e => atraso(e) > 0)
    .sort((a, b) => atraso(b) - atraso(a))
    .slice(0, 5);

  const noPrazo = dados.filter(e => atraso(e) === 0).length;
  const atrasadas = dados.filter(e => atraso(e) > 0).length;

  graficoTransportadora = criarGraficoBarra(
    document.getElementById("graficoTransportadora"),
    Object.keys(atrasoTransportadora),
    Object.values(atrasoTransportadora),
    "Dias de atraso"
  );

  graficoRegiao = criarGraficoBarra(
    document.getElementById("graficoRegiao"),
    Object.keys(atrasoRegiao),
    Object.values(atrasoRegiao),
    "Dias de atraso"
  );

  graficoStatus = criarGraficoStatus(
    document.getElementById("graficoStatus"),
    noPrazo,
    atrasadas
  );

  graficoRanking = criarGraficoBarra(
    document.getElementById("graficoRanking"),
    ranking.map(e => `${e.id} · ${e.cidade}`),
    ranking.map(e => atraso(e)),
    "Dias de atraso",
    true
  );
}

/**
 * Gera textos explicativos para os cards, botões e gráficos.
 */
function gerarTextoInsight(tipo) {
  const dados = dadosAtuais;
  const total = dados.length;
  const atrasadas = dados.filter(e => atraso(e) > 0);
  const taxa = total ? Math.round((atrasadas.length / total) * 100) : 0;
  const maior = [...dados].sort((a, b) => atraso(b) - atraso(a))[0];

  const somaTransportadora = agruparSoma(dados, "transportadora");
  const transportadoraCritica = Object.entries(somaTransportadora).sort((a, b) => b[1] - a[1])[0];

  const somaRegiao = agruparSoma(dados, "regiao");
  const regiaoCritica = Object.entries(somaRegiao).sort((a, b) => b[1] - a[1])[0];

  const textos = {
    total: [
      "Total de entregas analisadas",
      `O painel está considerando ${total} entregas após os filtros aplicados.`
    ],
    atrasadas: [
      "Entregas atrasadas",
      `${atrasadas.length} entregas estão atrasadas e devem receber atenção.`
    ],
    taxa: [
      "Taxa de atraso",
      `A taxa de atraso atual é de ${taxa}%.`
    ],
    maior: [
      "Maior atraso",
      maior
        ? `A entrega mais crítica é ${maior.id}, em ${maior.cidade}, com ${atraso(maior)} dias de atraso.`
        : "Não há entrega crítica no filtro atual."
    ],
    transportadora: [
      "Comparação entre transportadoras",
      transportadoraCritica
        ? `A transportadora com maior soma de atrasos é ${transportadoraCritica[0]}, com ${transportadoraCritica[1]} dias acumulados.`
        : "Não há atrasos por transportadora no filtro atual."
    ],
    regiao: [
      "Análise por região",
      regiaoCritica
        ? `A região mais crítica é ${regiaoCritica[0]}, somando ${regiaoCritica[1]} dias de atraso.`
        : "Não há atrasos por região no filtro atual."
    ],
    status: [
      "Status operacional",
      `No momento, ${taxa}% das entregas analisadas estão atrasadas.`
    ],
    ranking: [
      "Priorização dos problemas",
      "O ranking ordena as entregas pelo maior atraso, ajudando a definir prioridades."
    ],
    tabela: [
      "Tabela operacional",
      "A tabela detalha cada entrega e permite conferir cidade, região, transportadora, prazo, dias reais, atraso e status."
    ]
  };

  return textos[tipo] || ["Insight", "Use os filtros e gráficos para interpretar os dados."];
}

/**
 * Abre o modal com título e texto informativo.
 */
function abrirModal(titulo, texto) {
  document.getElementById("modalTitulo").textContent = titulo;
  document.getElementById("modalTexto").textContent = texto;
  document.getElementById("modal").classList.add("open");
}

/**
 * Fecha o modal de insight.
 */
function fecharModal() {
  document.getElementById("modal").classList.remove("open");
}

/**
 * Atualiza todo o dashboard sempre que filtros ou busca mudam.
 */
function atualizarDashboard() {
  dadosAtuais = obterDadosFiltrados();
  atualizarCards(dadosAtuais);
  atualizarInsightAutomatico(dadosAtuais);
  atualizarTabela(dadosAtuais);
  atualizarGraficos(dadosAtuais);
}

/**
 * Ativa os eventos dos filtros.
 */
document.getElementById("filtroRegiao").addEventListener("change", atualizarDashboard);
document.getElementById("filtroTransportadora").addEventListener("change", atualizarDashboard);
document.getElementById("busca").addEventListener("input", atualizarDashboard);

/**
 * Ativa os botões/cards que abrem insights em modal.
 */
document.querySelectorAll("[data-insight]").forEach(botao => {
  botao.addEventListener("click", () => {
    const tipo = botao.dataset.insight;
    const [titulo, texto] = gerarTextoInsight(tipo);
    abrirModal(titulo, texto);
  });
});

/**
 * Ativa o botão de fechar modal.
 */
document.getElementById("fecharModal").addEventListener("click", fecharModal);

/**
 * Fecha o modal quando o usuário clica fora da caixa.
 */
document.getElementById("modal").addEventListener("click", event => {
  if (event.target.id === "modal") fecharModal();
});

/**
 * Inicializa o dashboard.
 */
popularFiltros();
atualizarDashboard();