export function buildAvatarSrc(
  src?: string | null,
  updatedAt?: string | Date | null,
) {
  if (!src) return src ?? null;
  if (src.startsWith("data:")) return src;
  if (!updatedAt) return src;
  const version = new Date(updatedAt).getTime();
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${version}`;
}
