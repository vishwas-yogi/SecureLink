import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "// error: Username cannot be empty"),
  password: z.string().min(1, "// error: Password cannot be empty"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
