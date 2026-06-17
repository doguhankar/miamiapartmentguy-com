/**
 * Generate a unique slug for saved apartment lists
 * Uses random hex string for uniqueness
 */
export function generateSlug(): string {
  // Generate 12 random hex characters (48 bits of randomness)
  const randomBytes = Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256)
  );
  
  return randomBytes
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-f0-9]{12}$/.test(slug);
}
