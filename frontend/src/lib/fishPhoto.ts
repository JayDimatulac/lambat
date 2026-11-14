export const fishPhotoUrl = (species: string) =>
  `/images/fish/${species.toLowerCase().replace(/[^a-z]/g, '')}.jpg`