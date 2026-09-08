export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          home_county: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          home_county?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          home_county?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image: string | null
          latitude: number | null
          longitude: number | null
          name: string
          recommended_duration: string | null
          route_id: string
          stop_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          recommended_duration?: string | null
          route_id: string
          stop_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          recommended_duration?: string | null
          route_id?: string
          stop_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          best_time_to_visit: string | null
          category: string[]
          created_at: string
          description: string | null
          destination: string
          difficulty: string | null
          distance_km: number | null
          estimated_drive_minutes: number | null
          hero_image: string | null
          id: string
          is_featured: boolean
          name: string
          recommended_duration: string | null
          region: string | null
          slug: string
          starting_location: string
          updated_at: string
        }
        Insert: {
          best_time_to_visit?: string | null
          category?: string[]
          created_at?: string
          description?: string | null
          destination: string
          difficulty?: string | null
          distance_km?: number | null
          estimated_drive_minutes?: number | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          name: string
          recommended_duration?: string | null
          region?: string | null
          slug: string
          starting_location: string
          updated_at?: string
        }
        Update: {
          best_time_to_visit?: string | null
          category?: string[]
          created_at?: string
          description?: string | null
          destination?: string
          difficulty?: string | null
          distance_km?: number | null
          estimated_drive_minutes?: number | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          recommended_duration?: string | null
          region?: string | null
          slug?: string
          starting_location?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          created_at: string
          id: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_routes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_photos: {
        Row: {
          caption: string | null
          captured_at: string | null
          created_at: string
          id: string
          image_url: string
          latitude: number | null
          longitude: number | null
          trip_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          image_url: string
          latitude?: number | null
          longitude?: number | null
          trip_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          image_url?: string
          latitude?: number | null
          longitude?: number | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_distance_km: number | null
          actual_duration_minutes: number | null
          actual_fuel_cost: number | null
          actual_fuel_litres: number | null
          completed_at: string | null
          created_at: string
          estimated_fuel_cost: number | null
          estimated_fuel_litres: number | null
          id: string
          notes: string | null
          route_id: string | null
          started_at: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          actual_distance_km?: number | null
          actual_duration_minutes?: number | null
          actual_fuel_cost?: number | null
          actual_fuel_litres?: number | null
          completed_at?: string | null
          created_at?: string
          estimated_fuel_cost?: number | null
          estimated_fuel_litres?: number | null
          id?: string
          notes?: string | null
          route_id?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          actual_distance_km?: number | null
          actual_duration_minutes?: number | null
          actual_fuel_cost?: number | null
          actual_fuel_litres?: number | null
          completed_at?: string | null
          created_at?: string
          estimated_fuel_cost?: number | null
          estimated_fuel_litres?: number | null
          id?: string
          notes?: string | null
          route_id?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          fuel_consumption_km_per_litre: number | null
          fuel_tank_capacity: number | null
          fuel_type: string | null
          id: string
          is_primary: boolean
          make: string | null
          model: string | null
          name: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          fuel_consumption_km_per_litre?: number | null
          fuel_tank_capacity?: number | null
          fuel_type?: string | null
          id?: string
          is_primary?: boolean
          make?: string | null
          model?: string | null
          name?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          fuel_consumption_km_per_litre?: number | null
          fuel_tank_capacity?: number | null
          fuel_type?: string | null
          id?: string
          is_primary?: boolean
          make?: string | null
          model?: string | null
          name?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
