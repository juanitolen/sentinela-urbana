// Dados de demonstração (São Paulo/SP). Fontes públicas citadas de forma genérica/ilustrativa.
const MIN = 60 * 1000

export const PERSONAS = {
  morador: {
    role: 'morador',
    name: 'Ana Souza',
    roleLabel: 'Moradora · Mooca',
    initials: 'AS',
    home: [-23.559, -46.599],
    bairro: 'Mooca',
  },
  agente: {
    role: 'agente',
    name: 'Carlos Mendes',
    roleLabel: 'Agente da Defesa Civil',
    initials: 'CM',
    home: [-23.5503, -46.634],
    bairro: 'Centro',
  },
  operador: {
    role: 'operador',
    name: 'Juliana Prado',
    roleLabel: 'Operadora de serviço público',
    initials: 'JP',
    home: [-23.5430, -46.617],
    bairro: 'Brás',
  },
}

export function seedSources(now = Date.now()) {
  return [
    { id: 'SNS-ALG-014', name: 'Sensor de nível — Rio Tamanduateí', type: 'sensor', measures: 'alagamento', unit: 'cm', provider: 'Rede municipal de sensores IoT', protocol: 'MQTT/TLS', coords: [-23.556, -46.605], neighborhood: 'Mooca', intervalSec: 60, lastUpdate: now - 0.5 * MIN, status: 'online', calibrationDays: 32, reading: 38, uptime: 99.8, history: [12, 14, 18, 22, 27, 31, 34, 38] },
    { id: 'SNS-ALG-022', name: 'Sensor de nível — Córrego Aricanduva', type: 'sensor', measures: 'alagamento', unit: 'cm', provider: 'Rede municipal de sensores IoT', protocol: 'MQTT/TLS', coords: [-23.564, -46.513], neighborhood: 'Aricanduva', intervalSec: 60, lastUpdate: now - 1 * MIN, status: 'online', calibrationDays: 45, reading: 8, uptime: 99.5, history: [4, 4, 5, 6, 6, 7, 8, 8] },
    { id: 'SNS-ALG-031', name: 'Sensor de nível — Jardim Pantanal', type: 'sensor', measures: 'alagamento', unit: 'cm', provider: 'Rede municipal de sensores IoT', protocol: 'MQTT/TLS', coords: [-23.493, -46.417], neighborhood: 'Jardim Pantanal', intervalSec: 60, lastUpdate: now - 2 * MIN, status: 'degradado', calibrationDays: 124, reading: 22, uptime: 96.1, history: [10, 12, 15, 17, 19, 20, 21, 22] },
    { id: 'SNS-TMP-007', name: 'Estação térmica — Praça da Sé', type: 'sensor', measures: 'calor', unit: '°C', provider: 'Rede municipal de sensores IoT', protocol: 'MQTT/TLS', coords: [-23.5503, -46.634], neighborhood: 'Sé', intervalSec: 120, lastUpdate: now - 1.5 * MIN, status: 'online', calibrationDays: 20, reading: 36.4, humidity: 24, uptime: 99.9, history: [31, 32.5, 33.8, 34.6, 35.2, 35.9, 36.1, 36.4] },
    { id: 'SNS-TMP-011', name: 'Estação térmica — Brás', type: 'sensor', measures: 'calor', unit: '°C', provider: 'Rede municipal de sensores IoT', protocol: 'MQTT/TLS', coords: [-23.543, -46.617], neighborhood: 'Brás', intervalSec: 120, lastUpdate: now - 1 * MIN, status: 'online', calibrationDays: 61, reading: 34.1, humidity: 31, uptime: 99.7, history: [30, 31, 31.9, 32.6, 33.1, 33.5, 33.9, 34.1] },
    { id: 'API-MET-001', name: 'Estação meteorológica oficial (INMET)', type: 'publica', measures: 'chuva', unit: 'mm/h', provider: 'Instituto Nacional de Meteorologia — API pública', protocol: 'REST/HTTPS (polling 5 min)', coords: [-23.4962, -46.62], neighborhood: 'Mirante de Santana', intervalSec: 300, lastUpdate: now - 3 * MIN, status: 'online', reading: 42, uptime: 99.2, history: [0, 2, 6, 14, 22, 31, 38, 42] },
    { id: 'API-PLV-002', name: 'Pluviômetros automáticos (CEMADEN)', type: 'publica', measures: 'chuva', unit: 'mm/h', provider: 'Centro Nacional de Monitoramento de Desastres — dados abertos', protocol: 'REST/HTTPS (polling 10 min)', coords: [-23.58, -46.59], neighborhood: 'Vila Prudente', intervalSec: 600, lastUpdate: now - 7 * MIN, status: 'online', reading: 36, uptime: 98.7, history: [0, 1, 4, 11, 19, 27, 33, 36] },
    { id: 'API-ENE-003', name: 'Ocorrências da distribuidora de energia', type: 'publica', measures: 'energia', unit: 'domicílios', provider: 'Concessionária de energia — API de ocorrências', protocol: 'REST/HTTPS (webhook)', coords: [-23.567, -46.693], neighborhood: 'Pinheiros', intervalSec: 300, lastUpdate: now - 4 * MIN, status: 'online', reading: 18400, uptime: 99.0, history: [0, 0, 2100, 6800, 12000, 15500, 17900, 18400] },
    { id: 'API-AGU-004', name: 'Boletim de abastecimento de água', type: 'publica', measures: 'agua', unit: 'domicílios', provider: 'Companhia de saneamento — boletim público', protocol: 'CSV/HTTPS (polling 30 min)', coords: [-23.654, -46.71], neighborhood: 'Santo Amaro', intervalSec: 1800, lastUpdate: now - 48 * MIN, status: 'atrasado', reading: 6200, uptime: 94.3, history: [6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200] },
    { id: 'API-TRP-005', name: 'Transporte público em tempo real (GTFS-RT)', type: 'publica', measures: 'transporte', unit: 'min', provider: 'Gestora de transporte municipal — GTFS-RT', protocol: 'Protobuf/HTTPS (stream)', coords: [-23.522, -46.702], neighborhood: 'Lapa', intervalSec: 30, lastUpdate: now - 0.3 * MIN, status: 'online', reading: 75, uptime: 99.6, history: [0, 0, 10, 25, 40, 55, 68, 75] },
    { id: 'COM-APP', name: 'Registros da comunidade (app Sentinela)', type: 'comunidade', measures: 'todos', unit: '—', provider: 'Moradores cadastrados no app', protocol: 'HTTPS (app/PWA)', coords: [-23.55, -46.63], neighborhood: 'Toda a cidade', intervalSec: 0, lastUpdate: now - 2 * MIN, status: 'online', reading: 23, uptime: 99.9, history: [3, 5, 4, 9, 12, 15, 19, 23] },
  ]
}

// Eventos iniciais (entrada bruta). A store calcula confiança, risco e prioridade com o motor de regras.
export function seedEventInputs(now = Date.now()) {
  return [
    {
      id: 'EV-1119-0042', type: 'alagamento', title: 'Alagamento na Av. do Estado (Rio Tamanduateí)', neighborhood: 'Mooca', address: 'Av. do Estado, 3.200 — sentido Centro',
      coords: [-23.5565, -46.6045], value: 38, exposure: 3, radiusM: 900, affected: 12000,
      createdMin: 42, state: 'Alerta emitido',
      evidences: [
        { sourceId: 'SNS-ALG-014', sourceType: 'sensor', value: '38 cm', ageMin: 0.5, note: 'Leitura contínua, tendência de alta (+4 cm/10 min)' },
        { sourceId: 'API-PLV-002', sourceType: 'publica', value: '36 mm/h', ageMin: 7, note: 'Chuva forte registrada a 2,4 km' },
        { sourceId: 'COM-APP', sourceType: 'comunidade', value: 'Foto + relato', ageMin: 12, note: '"Água já passando da calçada na altura do nº 3.100"', hasPhoto: true, reporter: 'Morador #8F2A (reputação 0,8)' },
      ],
      history: [
        ['Reportado', 42, 'Ingestão automática (SNS-ALG-014)'], ['Em validação', 42, 'Validação técnica OK'], ['Confirmado', 41, 'Confiança Alta (≥ 50) — confirmação automática'], ['Alerta emitido', 41, 'Push + painel para 4.812 moradores no raio de 900 m'],
      ],
      notified: 4812,
    },
    {
      id: 'EV-1119-0041', type: 'calor', title: 'Ilha de calor no Centro — 36,4 °C e umidade 24%', neighborhood: 'Sé', address: 'Praça da Sé e entorno',
      coords: [-23.5503, -46.634], value: 36.4, extra: { humidity: 24 }, exposure: 3, radiusM: 1500, affected: 60000,
      createdMin: 95, state: 'Em monitoramento',
      evidences: [
        { sourceId: 'SNS-TMP-007', sourceType: 'sensor', value: '36,4 °C · UR 24%', ageMin: 1.5, note: 'Acima de 35 °C há 70 min' },
        { sourceId: 'SNS-TMP-011', sourceType: 'sensor', value: '34,1 °C', ageMin: 1, note: 'Estação vizinha (Brás) corrobora' },
      ],
      history: [
        ['Reportado', 95, 'Ingestão automática (SNS-TMP-007)'], ['Em validação', 95, 'Validação técnica OK'], ['Confirmado', 94, 'Confirmação automática'], ['Alerta emitido', 94, 'Push + painel'], ['Em monitoramento', 60, 'Pontos de hidratação ativados pela prefeitura'],
      ],
      notified: 21540,
    },
    {
      id: 'EV-1119-0040', type: 'energia', title: 'Falta de energia em Pinheiros — 18,4 mil domicílios', neighborhood: 'Pinheiros', address: 'Região da R. dos Pinheiros e Av. Rebouças',
      coords: [-23.567, -46.693], value: 18400, extra: { criticalFacility: false }, exposure: 2, radiusM: 1800, affected: 18400,
      createdMin: 55, state: 'Alerta emitido',
      evidences: [
        { sourceId: 'API-ENE-003', sourceType: 'publica', value: '18.400 domicílios', ageMin: 4, note: 'Previsão de restabelecimento: 19h30' },
        { sourceId: 'COM-APP', sourceType: 'comunidade', value: '9 relatos', ageMin: 20, note: 'Semáforos apagados na Av. Rebouças' },
      ],
      history: [
        ['Reportado', 55, 'Webhook da distribuidora'], ['Em validação', 55, 'Validação técnica OK'], ['Confirmado', 54, 'Confirmação automática'], ['Alerta emitido', 54, 'Push + painel'],
      ],
      notified: 9310,
    },
    {
      id: 'EV-1119-0043', type: 'alagamento', title: 'Possível alagamento na R. Taquari', neighborhood: 'Mooca', address: 'R. Taquari, 600',
      coords: [-23.5515, -46.597], value: 25, exposure: 2, radiusM: 400, affected: 1500,
      createdMin: 6, state: 'Em validação',
      evidences: [
        { sourceId: 'COM-APP', sourceType: 'comunidade', value: 'Relato sem foto', ageMin: 6, note: '"Bueiro transbordando, água na canela"', reporter: 'Morador #31C0 (reputação 0,3)' },
      ],
      history: [['Reportado', 6, 'Registro comunitário via app'], ['Em validação', 6, 'Confiança Baixa (< 50) — aguardando agente ou corroboração']],
      notified: 0,
    },
    {
      id: 'EV-1119-0039', type: 'transporte', title: 'Linha de ônibus interrompida na Lapa', neighborhood: 'Lapa', address: 'Terminal Lapa — 6 linhas afetadas',
      coords: [-23.522, -46.702], value: 75, exposure: 2, radiusM: 1200, affected: 8000,
      createdMin: 38, state: 'Alerta emitido',
      evidences: [{ sourceId: 'API-TRP-005', sourceType: 'publica', value: 'Atraso médio 75 min', ageMin: 0.3, note: 'Desvio por queda de árvore' }],
      history: [['Reportado', 38, 'Stream GTFS-RT'], ['Em validação', 38, 'Validação técnica OK'], ['Confirmado', 37, 'Confirmação automática'], ['Alerta emitido', 37, 'Painel']],
      notified: 2200,
    },
    {
      id: 'EV-1119-0038', type: 'agua', title: 'Falta de água em Santo Amaro', neighborhood: 'Santo Amaro', address: 'Setor de abastecimento Santo Amaro',
      coords: [-23.654, -46.71], value: 6200, exposure: 2, radiusM: 1400, affected: 6200,
      createdMin: 180, state: 'Em monitoramento',
      evidences: [{ sourceId: 'API-AGU-004', sourceType: 'publica', value: '6.200 domicílios', ageMin: 48, note: 'Boletim atrasado — último em 48 min' }],
      history: [['Reportado', 180, 'Boletim público'], ['Em validação', 180, 'Validação técnica OK'], ['Confirmado', 179, 'Confirmação automática'], ['Alerta emitido', 179, 'Painel'], ['Em monitoramento', 120, 'Manutenção em andamento']],
      notified: 3100,
    },
    {
      id: 'EV-1119-0044', type: 'alagamento', title: 'Nível subindo no Jardim Pantanal', neighborhood: 'Jardim Pantanal', address: 'Margem do Rio Tietê — R. Erva do Brejo',
      coords: [-23.493, -46.417], value: 22, exposure: 3, radiusM: 700, affected: 5400,
      createdMin: 15, state: 'Em validação',
      evidences: [{ sourceId: 'SNS-ALG-031', sourceType: 'sensor', value: '22 cm', ageMin: 2, note: 'Sensor com calibração vencida (124 dias)' }],
      history: [['Reportado', 15, 'Ingestão automática (SNS-ALG-031)'], ['Em validação', 15, 'Sensor degradado — validação humana solicitada']],
      notified: 0,
    },
    {
      id: 'EV-1119-0035', type: 'calor', title: 'Calor elevado no Brás', neighborhood: 'Brás', address: 'Largo da Concórdia',
      coords: [-23.543, -46.617], value: 34.1, extra: { humidity: 31 }, exposure: 2, radiusM: 900, affected: 15000,
      createdMin: 140, state: 'Em monitoramento',
      evidences: [{ sourceId: 'SNS-TMP-011', sourceType: 'sensor', value: '34,1 °C', ageMin: 1, note: '' }],
      history: [['Reportado', 140, 'Ingestão automática'], ['Em validação', 140, 'OK'], ['Confirmado', 139, 'Confirmação automática'], ['Alerta emitido', 139, 'Painel'], ['Em monitoramento', 100, '']],
      notified: 0,
    },
    {
      id: 'EV-1119-0031', type: 'alagamento', title: 'Alagamento na Av. Aricanduva (encerrado)', neighborhood: 'Aricanduva', address: 'Av. Aricanduva, 5.000',
      coords: [-23.564, -46.513], value: 8, exposure: 2, radiusM: 600, affected: 3000,
      createdMin: 420, state: 'Encerrado',
      evidences: [{ sourceId: 'SNS-ALG-022', sourceType: 'sensor', value: '8 cm', ageMin: 1, note: 'Nível normalizado há 2 h' }],
      history: [['Reportado', 420, 'Ingestão automática'], ['Em validação', 420, 'OK'], ['Confirmado', 419, 'Confirmação automática'], ['Alerta emitido', 419, 'Push + painel'], ['Em monitoramento', 300, ''], ['Encerrado', 180, 'Nível abaixo de 10 cm por 60 min']],
      notified: 2700,
    },
    {
      id: 'EV-1119-0029', type: 'alagamento', title: 'Relato de alagamento em Butantã (descartado)', neighborhood: 'Butantã', address: 'Av. Vital Brasil',
      coords: [-23.571, -46.708], value: 20, exposure: 2, radiusM: 300, affected: 0,
      createdMin: 300, state: 'Descartado',
      evidences: [{ sourceId: 'COM-APP', sourceType: 'comunidade', value: 'Relato sem foto', ageMin: 300, note: 'Câmera da CET não confirma', reporter: 'Morador #0A11 (reputação 0,1)' }],
      history: [['Reportado', 300, 'Registro comunitário'], ['Em validação', 300, 'Confiança Baixa'], ['Descartado', 288, 'Agente: não confirmado em vistoria por câmera']],
      notified: 0,
    },
  ]
}

export function seedNotifications(now = Date.now()) {
  return [
    { id: 'N-9001', eventId: 'EV-1119-0042', priority: 'P1', title: 'Alagamento perto de você', body: 'Av. do Estado com 38 cm de água e subindo. Evite a região e não atravesse áreas alagadas.', channels: ['push', 'sms', 'painel'], at: now - 41 * MIN, read: false, audience: ['morador', 'agente', 'operador'], kind: 'alerta' },
    { id: 'N-9002', eventId: 'EV-1119-0043', priority: 'P3', title: 'Validação pendente', body: 'Registro comunitário na R. Taquari aguarda validação (confiança 45 · Baixa). SLA: 30 min.', channels: ['painel'], at: now - 6 * MIN, read: false, audience: ['agente'], kind: 'tarefa' },
    { id: 'N-9003', eventId: 'EV-1119-0044', priority: 'P3', title: 'Sensor degradado requer validação', body: 'SNS-ALG-031 (Jardim Pantanal) com calibração vencida reporta 22 cm (confiança 45 · Baixa). Validar em até 30 min.', channels: ['painel'], at: now - 15 * MIN, read: false, audience: ['agente'], kind: 'tarefa' },
    { id: 'N-9004', eventId: 'EV-1119-0041', priority: 'P1', title: 'Calor extremo no Centro', body: '36,4 °C com umidade de 24%. Beba água, evite exposição ao sol entre 11h e 16h.', channels: ['push', 'sms', 'painel'], at: now - 94 * MIN, read: true, audience: ['morador', 'agente', 'operador'], kind: 'alerta' },
    { id: 'N-9005', eventId: 'EV-1119-0040', priority: 'P2', title: 'Falta de energia em Pinheiros', body: '18,4 mil domicílios sem energia. Previsão de restabelecimento: 19h30.', channels: ['push', 'painel'], at: now - 54 * MIN, read: true, audience: ['morador', 'agente', 'operador'], kind: 'alerta' },
    { id: 'N-9006', eventId: 'EV-1119-0038', priority: 'P3', title: 'Fonte com atraso', body: 'Boletim de abastecimento de água sem atualização há 48 min (esperado: 30 min).', channels: ['painel'], at: now - 18 * MIN, read: false, audience: ['operador', 'agente'], kind: 'sistema' },
    { id: 'N-9007', eventId: 'EV-1119-0031', priority: 'P4', title: 'Evento encerrado', body: 'Alagamento na Av. Aricanduva encerrado. Nível normalizado.', channels: ['painel'], at: now - 180 * MIN, read: true, audience: ['morador', 'agente', 'operador'], kind: 'encerramento' },
  ]
}
