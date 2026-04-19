export type UserRole = "practitioner" | "client";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
};

