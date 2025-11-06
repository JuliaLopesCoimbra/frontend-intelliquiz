// src/lib/auth.types.ts
export type SignUpPayload = {
  email: string;
  name: string;
  password: string;
  username: string;
};

export type SignUpResponse = {
  id: string;
  email: string;
  name: string;
  username: string;
  created_at?: string;
  access_token?: string;
  refresh_token?: string;
};
