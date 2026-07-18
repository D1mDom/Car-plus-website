import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DbCar {
  id: string;
  code: string;
  name: string;
  model: string;
  year: number;
  price: number;
  status: string;
  viewers: number;
  image: string;
  images: string[];
  body_type: string;
  tax_status: string;
  condition: string;
  fuel_type: string;
  color: string;
  description: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapDbCarToCar = (dbCar: DbCar): Car => ({
  id: dbCar.id,
  code: dbCar.code,
  name: dbCar.name,
  model: dbCar.model,
  year: dbCar.year,
  price: Number(dbCar.price),
  status: dbCar.status as CarStatus,
  viewers: dbCar.viewers,
  image: dbCar.image,
  images: dbCar.images,
  bodyType: dbCar.body_type,
  taxStatus: dbCar.tax_status,
  condition: dbCar.condition,
  fuelType: dbCar.fuel_type,
  color: dbCar.color,
  description: dbCar.description,
  isActive: dbCar.is_active,
  createdAt: dbCar.created_at,
  updatedAt: dbCar.updated_at,
});

const MOCK_CARS: Car[] = [
  {
    id: "mock-1",
    code: "DOM-001",
    name: "Toyota Prius 2012",
    model: "Prius Option 4",
    year: 2012,
    price: 18500,
    status: "ready",
    viewers: 250,
    image: "/cars/prius-silver.jpg",
    images: ["/cars/prius-silver.jpg", "/cars/prius-010-white.png"],
    bodyType: "Sedan",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Hybrid",
    color: "ស (White)",
    description: ["ឡានស្អាត អត់បុកអត់ប៉ះ", "ថ្ម 100%", "ម៉ាស៊ីនត្រជាក់រងា", "មានធានា"],
    isActive: true,
  },
  {
    id: "mock-2",
    code: "DOM-002",
    name: "Lexus RX330 2004",
    model: "RX330 Haft Full",
    year: 2004,
    price: 22000,
    status: "luxury",
    viewers: 420,
    image: "/cars/lexus-black.jpg",
    images: ["/cars/lexus-black.jpg"],
    bodyType: "SUV",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ខ្មៅ (Black)",
    description: ["ឡានថ្មីទើបកាត់ចូល", "ពណ៌ខ្មៅ ក្នុងលឿង", "ម៉ាស៊ីនឆេះស្ងាត់", "គុជ និងចង្កៀងថ្មីមុខក្រោយ"],
    isActive: true,
  },
  {
    id: "mock-3",
    code: "DOM-003",
    name: "Porsche 911 Carrera",
    model: "911",
    year: 2021,
    price: 135000,
    status: "luxury",
    viewers: 890,
    image: "/cars/1.jpg",
    images: ["/cars/1.jpg"],
    bodyType: "Sports",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ខៀវ (Blue)",
    description: ["Sport Chrono Package", "Premium Audio", "Excellent condition"],
    isActive: true,
  },
  {
    id: "mock-4",
    code: "DOM-004",
    name: "BMW M4 Competition",
    model: "M4",
    year: 2022,
    price: 85000,
    status: "onroad",
    viewers: 550,
    image: "/cars/bmw-blue.jpg",
    images: ["/cars/bmw-blue.jpg"],
    bodyType: "Coupe",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ស (White)",
    description: ["Full Carbon Exterior", "Red Leather Interior", "503 Horsepower"],
    isActive: true,
  },
  {
    id: "mock-5",
    code: "DOM-005",
    name: "Chevrolet Camaro SS",
    model: "Camaro",
    year: 2018,
    price: 45000,
    status: "ready",
    viewers: 320,
    image: "/cars/2.jpg",
    images: ["/cars/2.jpg"],
    bodyType: "Sports",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ក្រហម (Red)",
    description: ["V8 Engine", "Exhaust Upgrade", "Clean Title"],
    isActive: true,
  },
  {
    id: "mock-6",
    code: "DOM-006",
    name: "Audi RS7 Sportback",
    model: "RS7",
    year: 2023,
    price: 115000,
    status: "luxury",
    viewers: 670,
    image: "/cars/3.jpg",
    images: ["/cars/3.jpg"],
    bodyType: "Sedan",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ខ្មៅ (Black)",
    description: ["V8 Twin Turbo", "Bang & Olufsen Sound", "Soft Close Doors"],
    isActive: true,
  },
  {
    id: "mock-7",
    code: "DOM-007",
    name: "Mercedes-AMG GT",
    model: "AMG GT",
    year: 2020,
    price: 95000,
    status: "luxury",
    viewers: 820,
    image: "/cars/mercedes-silver.jpg",
    images: ["/cars/mercedes-silver.jpg"],
    bodyType: "Coupe",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ប្រផេះ (Grey)",
    description: ["Performance Exhaust", "Carbon Fiber Trim", "Low Mileage"],
    isActive: true,
  },
  {
    id: "mock-8",
    code: "DOM-008",
    name: "Tesla Model S Plaid",
    model: "Model S",
    year: 2023,
    price: 105000,
    status: "ready",
    viewers: 950,
    image: "/cars/4.jpg",
    images: ["/cars/4.jpg"],
    bodyType: "Sedan",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Electric",
    color: "ក្រហម (Red)",
    description: ["Autopilot Included", "Yoke Steering Wheel", "0-60 in 1.99s"],
    isActive: true,
  },
  {
    id: "mock-9",
    code: "DOM-009",
    name: "Ford Mustang GT",
    model: "Mustang",
    year: 2021,
    price: 42000,
    status: "plate",
    viewers: 430,
    image: "/cars/5.jpg",
    images: ["/cars/5.jpg"],
    bodyType: "Coupe",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ស (White)",
    description: ["5.0L V8 Engine", "Manual Transmission", "Apple CarPlay"],
    isActive: true,
  },
  {
    id: "mock-10",
    code: "DOM-010",
    name: "Range Rover Sport",
    model: "Sport HSE",
    year: 2020,
    price: 68000,
    status: "luxury",
    viewers: 610,
    image: "/cars/2.jpg",
    images: ["/cars/2.jpg"],
    bodyType: "SUV",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Diesel",
    color: "ប្រផេះ (Grey)",
    description: ["Air Suspension", "Meridian Sound System", "Panoramic Roof"],
    isActive: true,
  },
  {
    id: "mock-11",
    code: "DOM-011",
    name: "Toyota Tacoma TRD Pro",
    model: "Tacoma",
    year: 2022,
    price: 52000,
    status: "onroad",
    viewers: 850,
    image: "/cars/camry-white.jpg",
    images: ["/cars/camry-white.jpg"],
    bodyType: "Pickup",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ស (White)",
    description: ["Fox Shocks", "TRD Pro Exhaust", "JBL Premium Audio"],
    isActive: true,
  },
  {
    id: "mock-12",
    code: "DOM-012",
    name: "Honda Civic Type R",
    model: "Civic",
    year: 2023,
    price: 49000,
    status: "ready",
    viewers: 770,
    image: "/cars/civic-black.jpg",
    images: ["/cars/civic-black.jpg"],
    bodyType: "Hatchback",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ខ្មៅ (Black)",
    description: ["Manual Transmission", "Red Alcantara Seats", "Track Ready"],
    isActive: true,
  },
  {
    id: "mock-13",
    code: "DOM-013",
    name: "Jeep Wrangler Rubicon",
    model: "Wrangler",
    year: 2021,
    price: 55000,
    status: "plate",
    viewers: 520,
    image: "/cars/corolla-red.jpg",
    images: ["/cars/corolla-red.jpg"],
    bodyType: "SUV",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ក្រហម (Red)",
    description: ["Off-Road Tires", "Warn Winch", "Removable Roof"],
    isActive: true,
  },
  {
    id: "mock-14",
    code: "DOM-014",
    name: "Ferrari F8 Tributo",
    model: "F8",
    year: 2022,
    price: 350000,
    status: "luxury",
    viewers: 1500,
    image: "/cars/prius-010-white.png",
    images: ["/cars/prius-010-white.png"],
    bodyType: "Sports",
    taxStatus: "ក្រដាសពន្ធ (Tax Paper)",
    condition: "ថ្មី (Like New)",
    fuelType: "Gasoline",
    color: "ស (White)",
    description: ["V8 Twin Turbo", "Carbon Ceramic Brakes", "Carbon Steering Wheel"],
    isActive: true,
  },
  {
    id: "mock-15",
    code: "DOM-015",
    name: "Classic MGB Roadster",
    model: "MGB",
    year: 1974,
    price: 25000,
    status: "plate",
    viewers: 300,
    image: "/cars/1.jpg",
    images: ["/cars/1.jpg"],
    bodyType: "Convertible",
    taxStatus: "ស្លាកលេខ (Plate)",
    condition: "មួយទឹក (Used)",
    fuelType: "Gasoline",
    color: "ខៀវ (Blue)",
    description: ["Fully Restored", "Leather Interior", "Chrome Bumpers"],
    isActive: true,
  }
];

export const useCars = () => {
  return useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const cars = (data as DbCar[]).map(mapDbCarToCar);
      // Return mock cars if the database is empty so the UI has images/descriptions to show
      if (cars.length === 0) {
        return MOCK_CARS;
      }
      return cars;
    },
  });
};

export const useCarById = (id: string) => {
  return useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      // Check if it's a mock car first
      const mockCar = MOCK_CARS.find(c => c.id === id);
      if (mockCar) return mockCar;

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDbCarToCar(data as DbCar);
    },
    enabled: !!id,
  });
};

export const useCreateCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (car: Omit<Car, "id" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase
        .from("cars")
        .insert({
          code: car.code, name: car.name, model: car.model, year: car.year,
          price: car.price, status: car.status, viewers: car.viewers || 0,
          image: car.image, images: car.images, body_type: car.bodyType,
          tax_status: car.taxStatus, condition: car.condition, fuel_type: car.fuelType,
          color: car.color, description: car.description, is_active: car.isActive ?? true,
        })
        .select().single();
      if (error) throw error;
      return mapDbCarToCar(data as DbCar);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cars"] }); toast.success("បានបន្ថែមឡានដោយជោគជ័យ"); },
    onError: (error) => { toast.error("បរាជ័យក្នុងការបន្ថែមឡាន: " + error.message); },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...car }: Partial<Car> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (car.code !== undefined) updateData.code = car.code;
      if (car.name !== undefined) updateData.name = car.name;
      if (car.model !== undefined) updateData.model = car.model;
      if (car.year !== undefined) updateData.year = car.year;
      if (car.price !== undefined) updateData.price = car.price;
      if (car.status !== undefined) updateData.status = car.status;
      if (car.viewers !== undefined) updateData.viewers = car.viewers;
      if (car.image !== undefined) updateData.image = car.image;
      if (car.images !== undefined) updateData.images = car.images;
      if (car.bodyType !== undefined) updateData.body_type = car.bodyType;
      if (car.taxStatus !== undefined) updateData.tax_status = car.taxStatus;
      if (car.condition !== undefined) updateData.condition = car.condition;
      if (car.fuelType !== undefined) updateData.fuel_type = car.fuelType;
      if (car.color !== undefined) updateData.color = car.color;
      if (car.description !== undefined) updateData.description = car.description;
      if (car.isActive !== undefined) updateData.is_active = car.isActive;
      const { data, error } = await supabase.from("cars").update(updateData).eq("id", id).select().single();
      if (error) throw error;
      return mapDbCarToCar(data as DbCar);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cars"] }); toast.success("បានធ្វើបច្ចុប្បន្នភាពឡានដោយជោគជ័យ"); },
    onError: (error) => { toast.error("បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពឡាន: " + error.message); },
  });
};

export const useDeleteCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cars"] }); toast.success("បានលុបឡានដោយជោគជ័យ"); },
    onError: (error) => { toast.error("បរាជ័យក្នុងការលុបឡាន: " + error.message); },
  });
};

export const getStatusLabel = (status: CarStatus): string => {
  switch (status) {
    case "ready": return "ឡានរួចរាល់";
    case "onroad": return "ឡានលើផ្លូវ";
    case "luxury": return "ឡានប្រណីត";
    case "plate": return "មានស្លាកលេខ";
    default: return status;
  }
};
