
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
            "ai_usage": {
                  Row: {
                    "created_at": string,"id": number,"kind": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"kind": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"kind"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id"?: string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"close_friends": {
                  Row: {
                    "created_at": string,"friend_id": string,"owner_id": string
                  }
                  Insert: {
                    "created_at"?: string,"friend_id": string,"owner_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"friend_id"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "close_friends_friend_id_fkey"
      columns: ["friend_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "close_friends_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"countries": {
                  Row: {
                    "code": string,"lat": number | null,"lng": number | null,"name": string
                  }
                  Insert: {
                    "code": string,"lat"?: number | null,"lng"?: number | null,"name": string
                  }
                  Update: {
                    "code"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"follows": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"followee_id": string,"follower_id": string,"status": Database["public"]['Enums']["follow_status"]
                  }
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"followee_id": string,"follower_id"?: string,"status"?: Database["public"]['Enums']["follow_status"]
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"followee_id"?: string,"follower_id"?: string,"status"?: Database["public"]['Enums']["follow_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_followee_id_fkey"
      columns: ["followee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_invites": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"group_id": string,"revoked_at": string | null
                  }
                  Insert: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"group_id": string,"revoked_at"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"group_id"?: string,"revoked_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_invites_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    }
                  ]
                },"group_join_requests": {
                  Row: {
                    "created_at": string,"group_id": string,"invite_code": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"group_id": string,"invite_code"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"group_id"?: string,"invite_code"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_join_requests_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_join_requests_invite_code_fkey"
      columns: ["invite_code"]
isOneToOne: false
      referencedRelation: "group_invites"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "group_join_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "group_id": string,"joined_at": string,"role": Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  Insert: {
                    "group_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string,"icon": string,"id": string,"name": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string,"icon"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string,"icon"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"passions": {
                  Row: {
                    "icon": string,"id": string,"label": string,"sort_order": number
                  }
                  Insert: {
                    "icon": string,"id": string,"label": string,"sort_order"?: number
                  }
                  Update: {
                    "icon"?: string,"id"?: string,"label"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"prayer_audiences": {
                  Row: {
                    "audience_type": Database["public"]['Enums']["audience_type"],"group_id": string | null,"id": number,"request_id": string
                  }
                  Insert: {
                    "audience_type": Database["public"]['Enums']["audience_type"],"group_id"?: string | null,"id"?: never,"request_id": string
                  }
                  Update: {
                    "audience_type"?: Database["public"]['Enums']["audience_type"],"group_id"?: string | null,"id"?: never,"request_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_audiences_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayer_audiences_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "prayer_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayer_audiences_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "request_cards"
      referencedColumns: ["id"]
    }
                  ]
                },"prayer_requests": {
                  Row: {
                    "answered_at": string | null,"answered_update": string | null,"author_id": string,"author_public_id": string | null,"body": string,"country_code": string | null,"created_at": string,"hidden_at": string | null,"id": string,"is_anonymous": boolean,"kind": Database["public"]['Enums']["request_kind"],"language": string | null,"moment_label": string | null,"passion_id": string | null,"photo_path": string | null,"status": Database["public"]['Enums']["request_status"],"updated_at": string
                  }
                  Insert: {
                    "answered_at"?: string | null,"answered_update"?: string | null,"author_id"?: string,"author_public_id"?: never,"body": string,"country_code"?: string | null,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"is_anonymous"?: boolean,"kind"?: Database["public"]['Enums']["request_kind"],"language"?: string | null,"moment_label"?: string | null,"passion_id"?: string | null,"photo_path"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Update: {
                    "answered_at"?: string | null,"answered_update"?: string | null,"author_id"?: string,"author_public_id"?: never,"body"?: string,"country_code"?: string | null,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"is_anonymous"?: boolean,"kind"?: Database["public"]['Enums']["request_kind"],"language"?: string | null,"moment_label"?: string | null,"passion_id"?: string | null,"photo_path"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_requests_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayer_requests_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "prayer_requests_passion_id_fkey"
      columns: ["passion_id"]
isOneToOne: false
      referencedRelation: "passions"
      referencedColumns: ["id"]
    }
                  ]
                },"prayers": {
                  Row: {
                    "id": number,"prayed_at": string,"prayed_on": string,"request_id": string,"user_id": string
                  }
                  Insert: {
                    "id"?: never,"prayed_at"?: string,"prayed_on"?: string,"request_id": string,"user_id"?: string
                  }
                  Update: {
                    "id"?: never,"prayed_at"?: string,"prayed_on"?: string,"request_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayers_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "prayer_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayers_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "request_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string,"country_code": string | null,"created_at": string,"display_name": string,"handle": string | null,"id": string,"onboarded_at": string | null,"preferred_language": string,"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string,"country_code"?: string | null,"created_at"?: string,"display_name"?: string,"handle"?: string | null,"id": string,"onboarded_at"?: string | null,"preferred_language"?: string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string,"country_code"?: string | null,"created_at"?: string,"display_name"?: string,"handle"?: string | null,"id"?: string,"onboarded_at"?: string | null,"preferred_language"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    }
                  ]
                },"request_translations": {
                  Row: {
                    "answered_update": string | null,"body": string,"created_at": string,"request_id": string,"source_hash": string,"target_language": string
                  }
                  Insert: {
                    "answered_update"?: string | null,"body": string,"created_at"?: string,"request_id": string,"source_hash": string,"target_language": string
                  }
                  Update: {
                    "answered_update"?: string | null,"body"?: string,"created_at"?: string,"request_id"?: string,"source_hash"?: string,"target_language"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "request_translations_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "prayer_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "request_translations_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "request_cards"
      referencedColumns: ["id"]
    }
                  ]
                },"responses": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"hidden_at": string | null,"id": string,"is_private": boolean,"request_id": string
                  }
                  Insert: {
                    "author_id"?: string,"body": string,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"is_private"?: boolean,"request_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"is_private"?: boolean,"request_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "responses_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "responses_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "prayer_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "responses_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "request_cards"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "request_cards": {
                  Row: {
                    "answered_at": string | null,"answered_update": string | null,"audiences": Json | null,"author_avatar_url": string | null,"author_handle": string | null,"author_id": string | null,"author_name": string | null,"body": string | null,"country_code": string | null,"created_at": string | null,"id": string | null,"is_anonymous": boolean | null,"is_mine": boolean | null,"kind": Database["public"]['Enums']["request_kind"] | null,"language": string | null,"moment_label": string | null,"passion_id": string | null,"photo_path": string | null,"prayed_by_me": boolean | null,"prayer_count": number | null,"response_count": number | null,"status": Database["public"]['Enums']["request_status"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_requests_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "prayer_requests_passion_id_fkey"
      columns: ["passion_id"]
isOneToOne: false
      referencedRelation: "passions"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "cancel_join_request":
{ Args: { "p_group_id": string }; Returns: undefined
                           },
"create_group":
{ Args: { "p_description"?: string,"p_icon"?: string,"p_name": string }; Returns: string
                           },
"create_prayer_request":
{ Args: { "p_audiences"?: (string)[],"p_body": string,"p_country_code"?: string,"p_group_ids"?: (string)[],"p_is_anonymous"?: boolean,"p_kind"?: Database["public"]['Enums']["request_kind"],"p_language"?: string,"p_moment_label"?: string,"p_passion_id"?: string,"p_photo_path"?: string }; Returns: string
                           },
"group_feed":
{ Args: { "p_before"?: string,"p_group_id": string,"p_limit"?: number }; Returns: {
              "answered_at": string | null,
"answered_update": string | null,
"audiences": Json | null,
"author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body": string | null,
"country_code": string | null,
"created_at": string | null,
"id": string | null,
"is_anonymous": boolean | null,
"is_mine": boolean | null,
"kind": Database["public"]['Enums']["request_kind"] | null,
"language": string | null,
"moment_label": string | null,
"passion_id": string | null,
"photo_path": string | null,
"prayed_by_me": boolean | null,
"prayer_count": number | null,
"response_count": number | null,
"status": Database["public"]['Enums']["request_status"] | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "request_cards"
        isOneToOne: false
        isSetofReturn: true
      } },
"group_for_invite":
{ Args: { "p_code": string }; Returns: {
              "description": string,"group_id": string,"has_pending_request": boolean,"icon": string,"is_member": boolean,"member_count": number,"name": string
            }[]
                           },
"group_invite_code":
{ Args: { "p_group_id": string }; Returns: string
                           },
"home_feed":
{ Args: { "p_before"?: string,"p_limit"?: number }; Returns: {
              "answered_at": string | null,
"answered_update": string | null,
"audiences": Json | null,
"author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body": string | null,
"country_code": string | null,
"created_at": string | null,
"id": string | null,
"is_anonymous": boolean | null,
"is_mine": boolean | null,
"kind": Database["public"]['Enums']["request_kind"] | null,
"language": string | null,
"moment_label": string | null,
"passion_id": string | null,
"photo_path": string | null,
"prayed_by_me": boolean | null,
"prayer_count": number | null,
"response_count": number | null,
"status": Database["public"]['Enums']["request_status"] | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "request_cards"
        isOneToOne: false
        isSetofReturn: true
      } },
"leave_group":
{ Args: { "p_group_id": string }; Returns: undefined
                           },
"prayed_together":
{ Args: { "p_person": string }; Returns: {
              "answered_at": string | null,
"answered_update": string | null,
"audiences": Json | null,
"author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body": string | null,
"country_code": string | null,
"created_at": string | null,
"id": string | null,
"is_anonymous": boolean | null,
"is_mine": boolean | null,
"kind": Database["public"]['Enums']["request_kind"] | null,
"language": string | null,
"moment_label": string | null,
"passion_id": string | null,
"photo_path": string | null,
"prayed_by_me": boolean | null,
"prayer_count": number | null,
"response_count": number | null,
"status": Database["public"]['Enums']["request_status"] | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "request_cards"
        isOneToOne: false
        isSetofReturn: true
      } },
"remove_group_member":
{ Args: { "p_group_id": string,"p_user_id": string }; Returns: undefined
                           },
"request_to_join_group":
{ Args: { "p_code": string }; Returns: string
                           },
"reset_group_invite_code":
{ Args: { "p_group_id": string }; Returns: string
                           },
"respond_to_join_request":
{ Args: { "p_approve": boolean,"p_group_id": string,"p_user_id": string }; Returns: undefined
                           },
"set_group_member_role":
{ Args: { "p_group_id": string,"p_role": Database["public"]['Enums']["group_role"],"p_user_id": string }; Returns: undefined
                           },
"update_group":
{ Args: { "p_description": string,"p_group_id": string,"p_icon": string,"p_name": string }; Returns: undefined
                           },
"world_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "country_code": string,"open_requests": number
            }[]
                           },
"world_feed":
{ Args: { "p_before"?: string,"p_country": string,"p_limit"?: number }; Returns: {
              "answered_at": string | null,
"answered_update": string | null,
"audiences": Json | null,
"author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body": string | null,
"country_code": string | null,
"created_at": string | null,
"id": string | null,
"is_anonymous": boolean | null,
"is_mine": boolean | null,
"kind": Database["public"]['Enums']["request_kind"] | null,
"language": string | null,
"moment_label": string | null,
"passion_id": string | null,
"photo_path": string | null,
"prayed_by_me": boolean | null,
"prayer_count": number | null,
"response_count": number | null,
"status": Database["public"]['Enums']["request_status"] | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "request_cards"
        isOneToOne: false
        isSetofReturn: true
      } }
          }
          Enums: {
            "audience_type": "followers"|"close_friends"|"group"|"world","follow_status": "pending"|"accepted","group_role": "admin"|"member","request_kind": "request"|"moment","request_status": "open"|"answered"
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
            "audience_type": ["followers", "close_friends", "group", "world"],"follow_status": ["pending", "accepted"],"group_role": ["admin", "member"],"request_kind": ["request", "moment"],"request_status": ["open", "answered"]
          }
        }
} as const
