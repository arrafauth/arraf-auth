import { toNextHandlers } from "@arraf-auth/nextjs"
import { auth } from "@/lib/auth"

export const { GET, POST } = toNextHandlers(auth)