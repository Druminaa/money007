import { supabase } from '../lib/supabase'

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  try {
    // Delete old avatars
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId)
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToDelete)
    }

    // Upload new avatar
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}
