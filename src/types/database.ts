// ===========================================
// Supabase Database Types
// ===========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ===========================================
      // Profiles (extends auth.users)
      // ===========================================
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // ===========================================
      // Projects
      // ===========================================
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          repo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          repo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          repo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      // ===========================================
      // Analyses (saved analysis results)
      // ===========================================
      analyses: {
        Row: {
          id: string;
          project_id: string;
          type: 'code' | 'business' | 'competitor' | 'full';
          result: Json;
          metadata: Json | null;
          created_at: string;
          // New columns for version comparison (migration 002)
          version: number | null;
          alignment_score: number | null;
          summary: string | null;
          label: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: 'code' | 'business' | 'competitor' | 'full';
          result: Json;
          metadata?: Json | null;
          created_at?: string;
          // New columns (auto-populated by trigger)
          version?: number | null;
          alignment_score?: number | null;
          summary?: string | null;
          label?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: 'code' | 'business' | 'competitor' | 'full';
          result?: Json;
          metadata?: Json | null;
          // Updateable columns
          label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analyses_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };

      // ===========================================
      // Business Canvas (saved canvas data)
      // ===========================================
      business_canvases: {
        Row: {
          id: string;
          project_id: string;
          canvas: Json;
          business_stage: string | null;
          gaps_in_model: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          canvas: Json;
          business_stage?: string | null;
          gaps_in_model?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          canvas?: Json;
          business_stage?: string | null;
          gaps_in_model?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_canvases_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };

      // ===========================================
      // Competitors
      // ===========================================
      competitors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          url: string | null;
          social_links: Json | null;
          notes: string | null;
          profile: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          url?: string | null;
          social_links?: Json | null;
          notes?: string | null;
          profile?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          url?: string | null;
          social_links?: Json | null;
          notes?: string | null;
          profile?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'competitors_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };

      // ===========================================
      // Tasks (generated from gap analysis)
      // ===========================================
      tasks: {
        Row: {
          id: string;
          project_id: string;
          analysis_id: string | null;
          title: string;
          description: string | null;
          priority: 'critical' | 'high' | 'medium' | 'low';
          status: 'pending' | 'in_progress' | 'completed' | 'skipped';
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          analysis_id?: string | null;
          title: string;
          description?: string | null;
          priority?: 'critical' | 'high' | 'medium' | 'low';
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          analysis_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: 'critical' | 'high' | 'medium' | 'low';
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_analysis_id_fkey';
            columns: ['analysis_id'];
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      analysis_type: 'code' | 'business' | 'competitor' | 'full';
      task_priority: 'critical' | 'high' | 'medium' | 'low';
      task_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ===========================================
// Helper Types
// ===========================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience types
export type Profile = Tables<'profiles'>;
export type Project = Tables<'projects'>;
export type Analysis = Tables<'analyses'>;
export type BusinessCanvas = Tables<'business_canvases'>;
export type Competitor = Tables<'competitors'>;
export type Task = Tables<'tasks'>;
