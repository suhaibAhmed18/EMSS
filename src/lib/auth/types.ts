// Authentication types and interfaces
import { z } from 'zod'
import { UserRole } from '../database/types'

// User schema for authentication
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  shopifyStoreId: z.string().uuid().nullable(),
  role: UserRole.default('merchant'),
  createdAt: z.date(),
  lastLoginAt: z.date().nullable(),
})

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
})

export const UpdateUserSchema = CreateUserSchema.partial()

export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

// Session types
export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// Authentication error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super('Session has expired', 'SESSION_EXPIRED', 401)
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Invalid credentials provided', 'INVALID_CREDENTIALS', 401)
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('User not found', 'USER_NOT_FOUND', 404)
  }
}