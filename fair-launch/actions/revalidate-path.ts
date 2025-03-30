'use server';

import { revalidatePath } from "next/cache"

export const revalidatePathAction = async (path: string) => { 
  revalidatePath(path)
}