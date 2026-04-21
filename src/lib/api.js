import { supabase } from "./supabase";

export async function uploadImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `logs/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function insertRecord({ image_url, note, latitude, longitude }) {
  const { data, error } = await supabase
    .from("logs")
    .insert([{ image_url, note, latitude, longitude }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function fetchRecords() {
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteRecord(id, imageUrl) {
  if (imageUrl) {
    const urlParts = imageUrl.split("/images/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      console.log("[delete] removing storage file:", filePath);
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove([filePath]);
      if (storageError)
        console.warn("[delete] storage remove failed:", storageError.message);
    } else {
      console.warn("[delete] could not parse image_url:", imageUrl);
    }
  }

  const { error } = await supabase.from("logs").delete().eq("id", id);

  if (error) throw error;
}
