export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres acentuados (é → e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-');
}

export function createMenuSlug(name: string, id: string): string {
  const slug = generateSlug(name);
  const shortId = id.slice(-8);
  return `${slug}-${shortId}`;
}

export function extractMenuIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];

  if (shortId.length !== 8 || !/^[a-f0-9]{8}$/i.test(shortId)) return null;

  return shortId;
}
