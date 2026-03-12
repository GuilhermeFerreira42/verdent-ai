import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { JsonRpcRequestSchema, JsonRpcResponseSchema } from "../types/agent";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateJsonRpcRequest(data: unknown) {
  return JsonRpcRequestSchema.safeParse(data);
}

export function validateJsonRpcResponse(data: unknown) {
  return JsonRpcResponseSchema.safeParse(data);
}
