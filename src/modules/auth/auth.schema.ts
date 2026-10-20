import z from "zod";

export const signUpBodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.email(),
  password: z.string().min(8),
});

export const signInBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type SignUpBody = z.infer<typeof signUpBodySchema>;

export type SignInBody = z.infer<typeof signInBodySchema>;

export type SignInResponseDto = {
  token: string;
};
