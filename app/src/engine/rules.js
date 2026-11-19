/**
 * Motor de regras de negócio — Sentinela Urbana
 * Implementa as regras RN01–RN08 do Documento de Requisitos:
 *  - Nível de confiança do dado (RN01–RN03)
 *  - Nível de risco (RN04–RN05)
 *  - Prioridade do alerta e gate de emissão automática (RN06–RN07)
 *  - Canais de notificação por prioridade (RN08)
 */

export const SOURCE_TYPES = {
  sensor: { label: 'Sensor IoT', base: 90 },
  publica: { label: 'Base pública', base: 85 },
  comunidade: { label: 'Registro comunitário', base: 40 },
  agente: { label: 'Agente de campo', base: 95 },
}

export const EVENT_TYPES = {
  alagamento: { label: 'Alagamento', unit: 'cm' },
  calor: { label: 'Ilha de calor', unit: '°C' },
  energia: { label: 'Falta de energia', unit: 'domicílios' },
  agua: { label: 'Falta de água', unit: 'domicílios' },
  transporte: { label: 'Interrupção de transporte', unit: 'min' },
}

/* ---------- RN01–RN03: Confiança ---------- */
export function computeConfidence({
  sourceType,
  ageMin = 0,
  corroborations = 0,
  reputation = 0, // 0..1 (somente comunidade)
  hasPhoto = false,
  calibrationDays = 0, // somente sensor
  sensorStatus = 'online', // somente sensor
  validatedByAgent = false,
}) {
  if (validatedByAgent) {
    return { score: 100, level: 'Alta', factors: [{ label: 'Validado por agente da Defesa Civil', value: 100, kind: 'set' }] }
  }
  const base = SOURCE_TYPES[sourceType]?.base ?? 40
  const factors = [{ label: `Base da origem (${SOURCE_TYPES[sourceType]?.label})`, value: base, kind: 'base' }]
  let score = base

  // Atualidade do dado
  if (ageMin > 60) { score -= 25; factors.push({ label: 'Dado com mais de 60 min', value: -25 }) }
  else if (ageMin > 15) { score -= 10; factors.push({ label: 'Dado com mais de 15 min', value: -10 }) }

  // Corroboração por fontes independentes (raio 500 m / 30 min)
  if (corroborations > 0) {
    const c = Math.min(corroborations * 15, 30)
    score += c
    factors.push({ label: `Corroborado por ${corroborations} fonte(s) independente(s)`, value: c })
  }
  if (sourceType === 'comunidade') {
    const r = Math.round(reputation * 15)
    if (r > 0) { score += r; factors.push({ label: 'Reputação do relator', value: r }) }
    if (hasPhoto) { score += 10; factors.push({ label: 'Evidência com foto', value: 10 }) }
  }
  if (sourceType === 'sensor' && calibrationDays > 90) {
    score -= 15
    factors.push({ label: 'Calibração vencida (> 90 dias)', value: -15 })
  }
  if (sourceType === 'sensor' && sensorStatus === 'degradado') {
    score -= 30
    factors.push({ label: 'Sensor em estado degradado', value: -30 })
  }
  score = Math.max(0, Math.min(99, score)) // 100 só com validação humana
  return { score, level: confidenceLevel(score), factors }
}

export function confidenceLevel(score) {
  if (score >= 75) return 'Alta'
  if (score >= 50) return 'Média'
  return 'Baixa'
}

/* ---------- RN04: Severidade por tipo (1–4) ---------- */
export function computeSeverity(type, value, extra = {}) {
  switch (type) {
    case 'alagamento':
      if (value > 50) return 4
      if (value > 30) return 3
      if (value >= 10) return 2
      return 1
    case 'calor':
      if (value >= 38 || (value >= 35 && (extra.humidity ?? 100) < 20)) return 4
      if (value >= 35) return 3
      if (value >= 32) return 2
      return 1
    case 'energia':
    case 'agua':
      if (value > 50000 || extra.criticalFacility) return 4
      if (value > 10000) return 3
      if (value >= 1000) return 2
      return 1
    case 'transporte':
      if (value > 120) return 4
      if (value > 60) return 3
      if (value >= 20) return 2
      return 1
    default:
      return 1
  }
}

/* ---------- RN05: Nível de risco = severidade × exposição ---------- */
export const RISK_LEVELS = ['Baixo', 'Moderado', 'Alto', 'Crítico']
export const RISK_WEIGHT = { Baixo: 20, Moderado: 45, Alto: 70, Crítico: 95 }

export function computeRisk(severity, exposure) {
  const s = severity * exposure // 1..12
  let level = 'Baixo'
  if (s >= 9) level = 'Crítico'
  else if (s >= 6) level = 'Alto'
  else if (s >= 3) level = 'Moderado'
  return { matrix: s, level }
}

/* ---------- RN06–RN07: Prioridade e gate de emissão ---------- */
export function computePriority(riskLevel, confidenceScore) {
  const score = Math.round(0.7 * RISK_WEIGHT[riskLevel] + 0.3 * confidenceScore)
  let p = 'P4'
  if (score >= 85) p = 'P1'
  else if (score >= 65) p = 'P2'
  else if (score >= 45) p = 'P3'
  // RN07 — gate de confirmação automática: só dados com confiança >= 50 seguem sem validação humana
  const autoConfirm = confidenceScore >= 50
  // P1–P3 geram alerta; P4 vai direto para monitoramento (sem notificação)
  const emits = p !== 'P4'
  const slaMin = { P1: 5, P2: 10, P3: 30, P4: 120 }[p] // SLA de validação humana
  return { score, priority: p, autoConfirm, emits, slaMin }
}

/* ---------- RN08: Canais por prioridade ---------- */
export function channelsFor(priority) {
  return {
    P1: ['push', 'sms', 'painel'],
    P2: ['push', 'painel'],
    P3: ['painel'],
    P4: [],
  }[priority]
}

/* ---------- Ciclo de vida (Diagrama de Estados) ---------- */
export const STATES = ['Reportado', 'Em validação', 'Confirmado', 'Alerta emitido', 'Em monitoramento', 'Encerrado', 'Descartado']

export const TRANSITIONS = {
  Reportado: ['Em validação', 'Descartado'],
  'Em validação': ['Confirmado', 'Descartado'],
  Confirmado: ['Alerta emitido', 'Em monitoramento'],
  'Alerta emitido': ['Em monitoramento'],
  'Em monitoramento': ['Alerta emitido', 'Encerrado'],
  Encerrado: [],
  Descartado: [],
}

export function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to)
}

/** Distância aproximada em metros (haversine) — usada na deduplicação (raio 500 m). */
export function distanceM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
