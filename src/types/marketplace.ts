export type MotorcycleListing = {
  id: string
  name: string
  price: string
  year: number
  location: string
  image: string
}

export type Category = {
  id: string
  name: string
  variant: "cruiser" | "standard" | "chopper" | "bobber" | "cafe" | "other"
}
