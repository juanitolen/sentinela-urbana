# Sentinela Urbana — Urban Risk Intelligence Platform

Protótipo funcional da **Global Solution 2026.2 — Engenharia de Software (FIAP)**, desafio *CitizenTech*.

A Sentinela Urbana monitora riscos urbanos do dia a dia — **alagamentos**, **ilhas de calor** e **interrupções de serviços essenciais** (energia, água e transporte). Ela cruza dados de **sensores IoT**, **bases públicas** e **registros da comunidade**, calcula um **nível de confiança** para cada dado, classifica o **risco**, prioriza os alertas e notifica moradores e agentes locais, respeitando a **LGPD**.

- **Demo (deploy):** https://juanitolen.github.io/sentinela-urbana/
- **Documentação (PDF):** [`docs/Documentacao-Sentinela-Urbana.pdf`](docs/Documentacao-Sentinela-Urbana.pdf)
- **Diagramas:** [`docs/diagramas/`](docs/diagramas)

## Telas (10)

| # | Tela | Rota |
|---|------|------|
| T01 | Entrada por perfil e consentimento LGPD | `#/` |
| T02 | **Painel de acompanhamento** (mapa, indicadores, prioridades, frescor das fontes) | `#/painel` |
| T03 | **Lista de alertas** com filtros, origem e confiança | `#/alertas` |
| T04 | **Detalhe do alerta** (ciclo de vida, confiança e fatores, evidências, rastro de processamento, ações) | `#/alertas/:id` |
| T05 | **Central de notificações** | `#/notificacoes` |
| T06 | **Registro comunitário de ocorrência** (assistente em 4 etapas) | `#/reportar` |
| T07 | **Fontes e nível de confiança** + simulador de ingestão | `#/fontes` |
| T08 | Detalhe da fonte (origem, calibração, leituras, linhagem) | `#/fontes/:id` |
| T09 | Preferências de notificação e privacidade (LGPD) | `#/perfil` |
| T10 | Análises e indicadores de sucesso (agente/operador) | `#/analises` |

Três perfis de demonstração podem ser trocados no menu lateral: **Ana (moradora)**, **Carlos (agente da Defesa Civil)** e **Juliana (operadora de serviço público)**.

## Fluxos para testar

1. **Morador confirma um alerta:** Alertas → “Possível alagamento na R. Taquari” (Em validação, confiança 45) → *Também estou vendo isso* → a confiança sobe e o alerta é emitido.
2. **Registro comunitário:** Reportar → tipo → local → intensidade/foto → revisão → protocolo (fica *Em validação* até um agente ou outra fonte confirmar).
3. **Agente valida:** troque para *Agente da Defesa Civil* → Notificações → aba Tarefas → Validar → *Confirmar e emitir alerta*.
4. **Sensor gera alerta:** Fontes → Simulador de ingestão → *Enviar leitura* → cada etapa do Diagrama de Sequência aparece com tempo.
5. **LGPD:** Preferências e LGPD → consentimentos, exportar dados (JSON), excluir dados, trilha de auditoria.

O botão **Restaurar demonstração** (menu lateral) volta os dados ao estado inicial.

## Como executar

Requisitos: Node.js 20+.

```bash
cd app
npm install
npm run dev        # http://localhost:5173
# ou
npm run build && npm run preview
```

## Estrutura

```
app/                      protótipo (React 19 + Vite, React Router, Leaflet, Recharts, Lucide)
  src/engine/rules.js     motor de regras: confiança (RN01–RN03), risco (RN04–RN05), prioridade e gate (RN06–RN08)
  src/store/Store.jsx     pipeline: ingestão → validação → correlação → confiança → risco → prioridade → LGPD → notificação
  src/pages/              as 10 telas
  src/components/         layout, mapa e componentes de UI (badges de risco/origem, medidor de confiança)
docs/
  documentacao.html       fonte do PDF (requisitos, regras, diagramas Mermaid, arquitetura)
  Documentacao-Sentinela-Urbana.pdf
  diagramas/              sequência, estados e arquitetura (PNG/SVG)
  telas/                  capturas de tela
video/                    vídeo de demonstração e roteiro
tools/                    scripts Playwright (capturas, PDF, gravação do vídeo)
```

## Regras de priorização (resumo)

- **Confiança** = base da origem (sensor 90, base pública 85, comunidade 40, agente 95) + corroboração (+15 por fonte, até +30) + foto (+10) + reputação (até +15) − idade do dado (−10/−25) − calibração vencida (−15) − sensor degradado (−30). Validação por agente = 100. Faixas: Alta ≥ 75, Média 50–74, Baixa < 50.
- **Risco** = severidade (1–4, por tipo) × exposição (1–3) → Baixo, Moderado, Alto, Crítico.
- **Prioridade** = 0,7 × peso(risco) + 0,3 × confiança → P1 (≥ 85), P2 (65–84), P3 (45–64), P4 (< 45).
- **Gate:** sem alerta público com confiança < 50 ou com relato comunitário isolado; nesses casos o agente valida.

Os dados de sensores e APIs são simulados (atualizados a cada 5 s). Mapas: © Esri, © colaboradores do OpenStreetMap.

## Vídeo de demonstração

[`video/Demo-Sentinela-Urbana.mp4`](video/Demo-Sentinela-Urbana.mp4) — 2 min 14 s, narrado e legendado (roteiro em [`video/roteiro.json`](video/roteiro.json)). Gerado com `tools/record.mjs` (Playwright) e narração TTS pt-BR.

## Regerar artefatos

```bash
cd app && npm run build && npx vite preview --port 4173 &   # servidor local
cd tools && npm install && npx playwright install chromium
node docshots.mjs ../docs/telas                               # capturas de tela
node pdf.mjs ../docs/documentacao.html ../docs/Documentacao-Sentinela-Urbana.pdf
```

Para a entrega, preencha nomes, RMs e links na capa (`docs/documentacao.html`, marcadores `{{...}}`) e gere o PDF de novo.
