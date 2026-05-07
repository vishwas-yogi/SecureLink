import { z } from "zod";

const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 12) {
    ctx.addIssue({
      code: "custom",
      message: "// error: At least 12 characters",
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "// error: At least one uppercase letter",
    });
  }
  if (!/[a-z]/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "// error: At least one lowercase letter",
    });
  }
  if (!/\d/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "// error: At least one number",
    });
  }
  if (!/[^\da-zA-Z]/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "// error: At least one special character",
    });
  }
});

export const registerSchema = z.object({
  username: z.string().min(1, "// error: Username cannot be empty"),
  password: passwordSchema,
  name: z.string().min(1, "// error: Name cannot be empty"),
  email: z.email("// error: Invalid email"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
