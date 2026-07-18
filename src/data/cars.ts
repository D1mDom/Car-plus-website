import camryWhite from "@/assets/cars/camry-white.jpg";
import civicBlack from "@/assets/cars/civic-black.jpg";
import mercedesSilver from "@/assets/cars/mercedes-silver.jpg";
import bmwBlue from "@/assets/cars/bmw-blue.jpg";
import corollaRed from "@/assets/cars/corolla-red.jpg";
import lexusBlack from "@/assets/cars/lexus-black.jpg";
import priusSilver from "@/assets/cars/prius-silver.jpg";

export type CarStatus = "ready" | "onroad" | "luxury" | "plate";

export interface Car {
  id: string;
  code: string;
  name: string;
  model: string;
  year: number;
  price: number;
  status: CarStatus;
  viewers: number;
  image: string;
  images: string[];
  bodyType: string;
  taxStatus: string;
  condition: string;
  fuelType: string;
  color: string;
  description: string[];
}

export const carsData: Car[] = [
  {
    id: "1",
    code: "DCS2023_CAMRY_2020_SE_White",
    name: "Toyota Camry SE",
    model: "Toyota Camry",
    year: 2020,
    price: 28000,
    status: "ready",
    viewers: 20,
    image: camryWhite,
    images: [camryWhite, camryWhite, camryWhite],
    bodyType: "Sedan",
    taxStatus: "Tax slip",
    condition: "Excellent",
    fuelType: "Petrol",
    color: "White",
    description: [
      "Six‑month warranty on the engine and transmission.",
      "Three‑month warranty on the battery or hybrid system.",
      "Guarantee that the car has not been cut or repainted.",
      "Financing available or pay outright.",
      "Free registration plate, UV coating, floor mats and four tyres.",
    ],
  },
  {
    id: "2",
    code: "DCS1918_CIVIC_2018_EX_Black",
    name: "Honda Civic EX",
    model: "Honda Civic",
    year: 2018,
    price: 22500,
    status: "onroad",
    viewers: 14,
    image: civicBlack,
    images: [civicBlack, civicBlack, civicBlack],
    bodyType: "Sedan",
    taxStatus: "Tax paid",
    condition: "Very Good",
    fuelType: "Petrol",
    color: "Black",
    description: [
      "Six‑month warranty on the engine and transmission.",
      "Thorough inspection completed.",
      "Financing available or pay outright.",
      "Free registration plate and floor mats.",
    ],
  },
  {
    id: "3",
    code: "DCS2024_ECLASS_2021_LX_Silver",
    name: "Mercedes-Benz E-Class",
    model: "Mercedes-Benz E-Class",
    year: 2021,
    price: 65000,
    status: "luxury",
    viewers: 32,
    image: mercedesSilver,
    images: [mercedesSilver, mercedesSilver, mercedesSilver],
    bodyType: "Sedan",
    taxStatus: "Tax slip",
    condition: "Excellent",
    fuelType: "Petrol",
    color: "Silver",
    description: [
      "Premium luxury sedan with full service history.",
      "One‑year warranty on the engine and transmission.",
      "Six‑month warranty on electronics.",
      "Guarantee that the car has not been cut or repainted.",
      "Financing available or pay outright.",
      "Free registration plate, ceramic coating, floor mats and premium tyres.",
    ],
  },
  {
    id: "4",
    code: "DCS2022_3SERIES_2019_M_Blue",
    name: "BMW 3 Series M Sport",
    model: "BMW 3 Series",
    year: 2019,
    price: 45000,
    status: "plate",
    viewers: 25,
    image: bmwBlue,
    images: [bmwBlue, bmwBlue, bmwBlue],
    bodyType: "Sedan",
    taxStatus: "Tax paid",
    condition: "Excellent",
    fuelType: "Petrol",
    color: "Blue",
    description: [
      "Sporty M Sport package with premium features.",
      "Six‑month warranty on the engine and transmission.",
      "Complete documentation included.",
      "Financing available or pay outright.",
      "Registration plate already included.",
    ],
  },
  {
    id: "5",
    code: "DCS2021_COROLLA_2020_LE_Red",
    name: "Toyota Corolla LE",
    model: "Toyota Corolla",
    year: 2020,
    price: 21000,
    status: "ready",
    viewers: 18,
    image: corollaRed,
    images: [corollaRed, corollaRed, corollaRed],
    bodyType: "Sedan",
    taxStatus: "Tax slip",
    condition: "Very Good",
    fuelType: "Petrol",
    color: "Red",
    description: [
      "Reliable daily driver with excellent fuel economy.",
      "Six‑month warranty on the engine and transmission.",
      "Guarantee that the car has not been cut or repainted.",
      "Financing available or pay outright.",
      "Free registration plate and floor mats.",
    ],
  },
  {
    id: "6",
    code: "DCS2025_ES350_2022_LX_Black",
    name: "Lexus ES 350",
    model: "Lexus ES",
    year: 2022,
    price: 58000,
    status: "luxury",
    viewers: 28,
    image: lexusBlack,
    images: [lexusBlack, lexusBlack, lexusBlack],
    bodyType: "Sedan",
    taxStatus: "Tax slip",
    condition: "Excellent",
    fuelType: "Petrol",
    color: "Black",
    description: [
      "Premium luxury sedan with cutting-edge technology.",
      "One‑year warranty on the engine and transmission.",
      "Six‑month warranty on the hybrid system.",
      "Guarantee that the car has not been cut or repainted.",
      "Financing available or pay outright.",
      "Free registration plate, ceramic coating, premium floor mats and tyres.",
    ],
  },
  {
    id: "7",
    code: "DCS2026_PRIUS_2022_XLE_Silver",
    name: "Toyota Prius XLE",
    model: "Toyota Prius",
    year: 2022,
    price: 32000,
    status: "ready",
    viewers: 24,
    image: priusSilver,
    images: [priusSilver, priusSilver, priusSilver],
    bodyType: "Hatchback",
    taxStatus: "Tax slip",
    condition: "Excellent",
    fuelType: "Hybrid",
    color: "Silver",
    description: [
      "Fuel-efficient hybrid with excellent MPG.",
      "Six‑month warranty on the engine and transmission.",
      "Six‑month warranty on the hybrid battery system.",
      "Guarantee that the car has not been cut or repainted.",
      "Financing available or pay outright.",
      "Free registration plate, UV coating, floor mats and four tyres.",
    ],
  },
];

export const getStatusLabel = (status: CarStatus): string => {
  switch (status) {
    case "ready":
      return "Ready car";
    case "onroad":
      return "On-road car";
    case "luxury":
      return "Luxury car";
    case "plate":
      return "With licence plate";
    default:
      return status;
  }
};

export const getCarById = (id: string): Car | undefined => {
  return carsData.find((car) => car.id === id);
};
