import { z } from 'zod'
import { cpf } from 'cpf-cnpj-validator'

export const cadastroSchema = z
  .object({
    nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    cpf: z
      .string()
      .min(1, 'CPF é obrigatório')
      .refine((val) => cpf.isValid(val), 'CPF inválido'),
    senha: z
      .string()
      .min(8, 'Senha deve ter ao menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

export type CadastroFormData = z.infer<typeof cadastroSchema>

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>

export const novaSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(8, 'Senha deve ter ao menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

export type NovaSenhaFormData = z.infer<typeof novaSenhaSchema>
