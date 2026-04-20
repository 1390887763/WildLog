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

export async function deleteRecord(id) {
  const { error } = await supabase.from("logs").delete().eq("id", id);

  if (error) throw error;
}
