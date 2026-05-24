import { fileManager } from "$lib/files/fileManager"
import { json } from "@sveltejs/kit"

export async function POST({request}) {
  try {
    const {filename} = await request.json()
    const result = await fileManager.promoteTempFile(filename)
    return json({message: result})
  } catch (err: any) {
    return json(err) 
  }
}
