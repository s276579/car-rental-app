export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          location_id: string
          created_at: string
          model: string
          make: string
          year: number
          license_plate: string
          colour: string
          rental_rate: number
          status: string
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          model: string
          make: string
          year: number
          license_plate: string
          colour: string
          rental_rate: number
          status: string
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          model?: string
          make?: string
          year?: number
          license_plate?: string
          colour?: string
          rental_rate?: number
          status?: string
        }
      }
      customers: {
        Row: {
          id: string
          created_at: string
          first_name: string | null
          last_name: string | null
          licence_number: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          county: string | null
          postcode: string | null
          date_of_birth: string | null
          admin: boolean
        }
        Insert: {
          id: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          licence_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          postcode?: string | null
          date_of_birth?: string | null
          admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          licence_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          postcode?: string | null
          date_of_birth?: string | null
          admin?: boolean
        }
      }
      insurance: {
        Row: {
          id: string
          created_at: string
          rental_id: string
          type: string
          cost: number
          start_date: string
          end_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          rental_id: string
          type: string
          cost: number
          start_date: string
          end_date: string
        }
        Update: {
          id?: string
          created_at?: string
          rental_id?: string
          type?: string
          cost?: number
          start_date?: string
          end_date?: string
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          name: string
          address_line1: string
          address_line2: string
          city: string
          county: string
          postcode: string
          phone_number: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address_line1: string
          address_line2: string
          city: string
          county: string
          postcode: string
          phone_number: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address_line1?: string
          address_line2?: string
          city?: string
          county?: string
          postcode?: string
          phone_number?: string
        }
      }
      maintenance: {
        Row: {
          id: number
          created_at: string
          car_id: string
          date: string
          description: string
          cost: number
          type: string
        }
        Insert: {
          id?: number
          created_at?: string
          car_id: string
          date: string
          description: string
          cost: number
          type: string
        }
        Update: {
          id?: number
          created_at?: string
          car_id?: string
          date?: string
          description?: string
          cost?: number
          type?: string
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          amount: number
          date: string
          method: string
          status: string
          rental_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          amount: number
          date: string
          method: string
          status: string
          rental_id: string
        }
        Update: {
          id?: string
          created_at?: string
          amount?: number
          date?: string
          method?: string
          status?: string
          rental_id?: string
        }
      }
      rentals: {
        Row: {
          id: string
          created_at: string
          car_id: string
          customer_id: string
          start_date: string
          end_date: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          car_id: string
          customer_id: string
          start_date: string
          end_date: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          car_id?: string
          customer_id?: string
          start_date?: string
          end_date?: string
          status?: string
        }
      }
    }
  }
}

