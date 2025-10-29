export const USERS = [
  { 
    email: "brian.robertson@allanwater.co.uk", 
    password: "bru1972",
    roles: ["APPROVER", "SUBMITTER"] // <-- This user can do both
  },
  { 
    email: "adam.hodge@allanwater.co.uk", 
    password: "1234",
    roles: ["SUBMITTER"] // <-- This user can only submit
  }
];

// Helper functions to check roles
export const hasRole = (userRoles: string[], role: string) => {
  return userRoles.includes(role);
};