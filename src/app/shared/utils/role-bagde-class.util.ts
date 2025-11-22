export function getRoleBadgeClass(role?: string): string {
  const roleClasses = {
    SUPER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    USER: 'bg-green-100 text-green-800 border-green-200',
  } as const;

  return (
    roleClasses[role as keyof typeof roleClasses] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200'
  );
}
