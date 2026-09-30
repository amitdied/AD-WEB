import bcrypt from 'bcryptjs';

export async function generateAdminPasswordHash(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyAdminPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$2')) {
    return await bcrypt.compare(password, hash);
  }
  return false;
}
