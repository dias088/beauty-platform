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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          client_id: string
          client_notes: string | null
          created_at: string
          duration_minutes_snapshot: number
          ends_at: string
          id: string
          master_id: string
          master_notes: string | null
          price_kzt_snapshot: number
          service_id: string
          service_name_snapshot: string
          slot_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          status_changed_at: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_notes?: string | null
          created_at?: string
          duration_minutes_snapshot: number
          ends_at: string
          id?: string
          master_id: string
          master_notes?: string | null
          price_kzt_snapshot: number
          service_id: string
          service_name_snapshot: string
          slot_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          status_changed_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_notes?: string | null
          created_at?: string
          duration_minutes_snapshot?: number
          ends_at?: string
          id?: string
          master_id?: string
          master_notes?: string | null
          price_kzt_snapshot?: number
          service_id?: string
          service_name_snapshot?: string
          slot_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          status_changed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      client_scores: {
        Row: {
          client_id: string
          completed_bookings: number
          late_cancellations: number
          level: Database["public"]["Enums"]["client_level"]
          no_shows: number
          score: number
          total_bookings: number
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_bookings?: number
          late_cancellations?: number
          level?: Database["public"]["Enums"]["client_level"]
          no_shows?: number
          score?: number
          total_bookings?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_bookings?: number
          late_cancellations?: number
          level?: Database["public"]["Enums"]["client_level"]
          no_shows?: number
          score?: number
          total_bookings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      masters: {
        Row: {
          address: string | null
          bio: string | null
          categories: Database["public"]["Enums"]["service_category"][]
          city: string
          completed_bookings: number
          created_at: string
          id: string
          instagram_handle: string | null
          is_active: boolean
          is_verified: boolean
          lat: number | null
          lng: number | null
          profile_id: string
          rating: number
          reviews_count: number
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          address?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["service_category"][]
          city?: string
          completed_bookings?: number
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          profile_id: string
          rating?: number
          reviews_count?: number
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          address?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["service_category"][]
          city?: string
          completed_bookings?: number
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          profile_id?: string
          rating?: number
          reviews_count?: number
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "masters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_photos: {
        Row: {
          created_at: string
          id: string
          master_id: string
          position: number
          storage_path: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_id: string
          position?: number
          storage_path: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          master_id?: string
          position?: number
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          created_at: string
          id: string
          master_id: string
          rating: number
          text: string | null
        }
        Insert: {
          booking_id: string
          client_id: string
          created_at?: string
          id?: string
          master_id: string
          rating: number
          text?: string | null
        }
        Update: {
          booking_id?: string
          client_id?: string
          created_at?: string
          id?: string
          master_id?: string
          rating?: number
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          master_id: string
          name: string
          price_kzt: number
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          master_id: string
          name: string
          price_kzt: number
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          master_id?: string
          name?: string
          price_kzt?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_booked: boolean
          master_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_booked?: boolean
          master_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_booked?: boolean
          master_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled_by_client"
        | "cancelled_by_master"
        | "completed"
        | "no_show"
      client_level: "new" | "verified" | "trusted"
      service_category:
        | "nail"
        | "lash"
        | "brow"
        | "hair"
        | "makeup"
        | "cosmetology"
      user_role: "client" | "master"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "cancelled_by_client",
        "cancelled_by_master",
        "completed",
        "no_show",
      ],
      client_level: ["new", "verified", "trusted"],
      service_category: [
        "nail",
        "lash",
        "brow",
        "hair",
        "makeup",
        "cosmetology",
      ],
      user_role: ["client", "master"],
    },
  },
} as const
