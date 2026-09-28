import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email().max(254)

const senhaCadastroSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no maximo 72 caracteres')
  .regex(/[A-Za-z]/, 'A senha deve conter uma letra')
  .regex(/[0-9]/, 'A senha deve conter um numero')

export const registrarUsuarioSchema = z
  .object({
    nome: z.string().trim().min(2).max(120),
    email: emailSchema,
    senha: senhaCadastroSchema,
  })
  .strict()

export const entrarSchema = z
  .object({
    email: emailSchema,
    senha: z.string().min(1).max(72),
  })
  .strict()

export type RegistrarUsuarioEntrada = z.infer<typeof registrarUsuarioSchema>
export type EntrarEntrada = z.infer<typeof entrarSchema>
