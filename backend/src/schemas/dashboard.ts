import { z } from 'zod'

export const consultarDashboardSchema = z.object({
  meses: z.coerce.number().int().min(3).max(12).default(6),
})

export type ConsultarDashboardEntrada = z.infer<
  typeof consultarDashboardSchema
>
