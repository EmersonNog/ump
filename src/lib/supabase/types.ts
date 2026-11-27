
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "agenda_eventos": {
                  Row: {
                    "created_at": string,"criado_por": string | null,"data": string,"descricao": string | null,"hora": string | null,"id": string,"local": string | null,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"criado_por"?: string | null,"data": string,"descricao"?: string | null,"hora"?: string | null,"id"?: string,"local"?: string | null,"titulo": string
                  }
                  Update: {
                    "created_at"?: string,"criado_por"?: string | null,"data"?: string,"descricao"?: string | null,"hora"?: string | null,"id"?: string,"local"?: string | null,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_eventos_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"agenda_presencas": {
                  Row: {
                    "evento_id": string,"membro_id": string,"updated_at": string,"vai": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "evento_id": string,"membro_id"?: string,"updated_at"?: string,"vai": boolean
                  }
                  Update: {
                    "evento_id"?: string,"membro_id"?: string,"updated_at"?: string,"vai"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_presencas_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "agenda_eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "agenda_presencas_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cobrancas": {
                  Row: {
                    "ativa": boolean,"competencia": string | null,"created_at": string,"descricao": string | null,"id": string,"tipo": Database["public"]['Enums']["cobranca_tipo"],"titulo": string,"valor": number,"vencimento": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativa"?: boolean,"competencia"?: string | null,"created_at"?: string,"descricao"?: string | null,"id"?: string,"tipo": Database["public"]['Enums']["cobranca_tipo"],"titulo": string,"valor": number,"vencimento"?: string | null
                  }
                  Update: {
                    "ativa"?: boolean,"competencia"?: string | null,"created_at"?: string,"descricao"?: string | null,"id"?: string,"tipo"?: Database["public"]['Enums']["cobranca_tipo"],"titulo"?: string,"valor"?: number,"vencimento"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"lancamentos": {
                  Row: {
                    "categoria": string,"created_at": string,"criado_por": string | null,"data": string,"detalhes": string,"forma": string,"id": string,"origem": string,"pagamento_id": string | null,"socio_id": string | null,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria"?: string,"created_at"?: string,"criado_por"?: string | null,"data": string,"detalhes": string,"forma"?: string,"id"?: string,"origem"?: string,"pagamento_id"?: string | null,"socio_id"?: string | null,"valor": number
                  }
                  Update: {
                    "categoria"?: string,"created_at"?: string,"criado_por"?: string | null,"data"?: string,"detalhes"?: string,"forma"?: string,"id"?: string,"origem"?: string,"pagamento_id"?: string | null,"socio_id"?: string | null,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lancamentos_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_pagamento_id_fkey"
      columns: ["pagamento_id"]
isOneToOne: true
      referencedRelation: "pagamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_socio_id_fkey"
      columns: ["socio_id"]
isOneToOne: false
      referencedRelation: "socios"
      referencedColumns: ["id"]
    }
                  ]
                },"pagamentos": {
                  Row: {
                    "cobranca_id": string,"comprovante_path": string,"created_at": string,"data_pagamento": string,"id": string,"membro_id": string,"motivo": string | null,"observacao": string | null,"revisado_em": string | null,"revisado_por": string | null,"status": Database["public"]['Enums']["pagamento_status"],"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cobranca_id": string,"comprovante_path": string,"created_at"?: string,"data_pagamento": string,"id"?: string,"membro_id": string,"motivo"?: string | null,"observacao"?: string | null,"revisado_em"?: string | null,"revisado_por"?: string | null,"status"?: Database["public"]['Enums']["pagamento_status"],"valor": number
                  }
                  Update: {
                    "cobranca_id"?: string,"comprovante_path"?: string,"created_at"?: string,"data_pagamento"?: string,"id"?: string,"membro_id"?: string,"motivo"?: string | null,"observacao"?: string | null,"revisado_em"?: string | null,"revisado_por"?: string | null,"status"?: Database["public"]['Enums']["pagamento_status"],"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagamentos_cobranca_id_fkey"
      columns: ["cobranca_id"]
isOneToOne: false
      referencedRelation: "cobrancas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagamentos_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagamentos_revisado_por_fkey"
      columns: ["revisado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "ativo": boolean,"created_at": string,"email": string,"id": string,"nome": string,"papel": Database["public"]['Enums']["papel"],"telefone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"email": string,"id": string,"nome": string,"papel"?: Database["public"]['Enums']["papel"],"telefone"?: string | null
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"email"?: string,"id"?: string,"nome"?: string,"papel"?: Database["public"]['Enums']["papel"],"telefone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"p256dh": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"p256dh": string,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"p256dh"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"socios": {
                  Row: {
                    "created_at": string,"id": string,"nascimento": string | null,"nome": string,"situacao": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"nascimento"?: string | null,"nome": string,"situacao"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"nascimento"?: string | null,"nome"?: string,"situacao"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "cobranca_tipo": "mensalidade"|"evento","pagamento_status": "em_analise"|"pago"|"nao_pago","papel": "membro"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "cobranca_tipo": ["mensalidade", "evento"],"pagamento_status": ["em_analise", "pago", "nao_pago"],"papel": ["membro", "admin"]
          }
        }
} as const
