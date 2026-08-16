export type ProfileRecord = {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type MeResponse = {
  id: string;
  email: string;
  fullName: string;
};
