import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { consultarDashboardSchema } from '../schemas/dashboard.js'

describe('consulta do dashboard', () => {
  it('usa seis meses como periodo padrao', () => {
    assert.deepEqual(consultarDashboardSchema.parse({}), { meses: 6 })
  })

  it('converte o periodo recebido pela URL', () => {
    assert.deepEqual(consultarDashboardSchema.parse({ meses: '12' }), {
      meses: 12,
    })
  })

  it('rejeita periodos fora do intervalo permitido', () => {
    assert.equal(
      consultarDashboardSchema.safeParse({ meses: '24' }).success,
      false,
    )
  })
})
