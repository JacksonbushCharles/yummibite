export const restaurantConfig = {
  name: "Yummibite",
  tagline: "A table worth gathering around.",
  description:
    "A restaurant shaped by good food, warm hospitality and the pleasure of sharing a meal.",
  contact: {
    address: "Restaurant address to be confirmed",
    phone: "Restaurant phone to be confirmed",
    email: "Restaurant email to be confirmed",
    mapsUrl: "",
    instagramUrl: "",
  },
  openingHours: "Opening hours to be confirmed",
  reservation: {
    durationMinutes: 120,
    bufferMinutes: 15,
    intervalMinutes: 30,
    maxPartySize: 12,
    minimumAdvanceMinutes: 60,
    maximumAdvanceDays: 60,
  },
} as const;
