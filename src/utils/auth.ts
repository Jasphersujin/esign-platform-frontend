// src/utils/auth.ts

const AUTH_KEYS = {
  accessToken: "accessToken",
  tokenType: "tokenType",
  expiresIn: "expiresIn",
  user: "user",

  userId: "userId",
  employeeId: "employeeId",
  employeeName: "employeeName",
  employeeEmail: "employeeEmail",

  roleId: "roleId",
  roleCode: "roleCode",
  roleName: "roleName",
} as const;

export function setAuthData(data: any) {
  const { accessToken, tokenType, expiresIn, user } = data;

  localStorage.setItem(AUTH_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_KEYS.tokenType, tokenType);
  localStorage.setItem(
    AUTH_KEYS.expiresIn,
    String(expiresIn)
  );

  localStorage.setItem(
    AUTH_KEYS.user,
    JSON.stringify(user)
  );

  // User details
  localStorage.setItem(AUTH_KEYS.userId, user.id);
  localStorage.setItem(AUTH_KEYS.employeeId, user.employeeId);
  localStorage.setItem(AUTH_KEYS.employeeName, user.employeeName);
  localStorage.setItem(AUTH_KEYS.employeeEmail, user.email);

  // Role details
  localStorage.setItem(AUTH_KEYS.roleId, user.roleId);
  localStorage.setItem(AUTH_KEYS.roleCode, user.roleCode);
  localStorage.setItem(AUTH_KEYS.roleName, user.roleName);
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.accessToken);
}

export function getTokenType() {
  return localStorage.getItem(AUTH_KEYS.tokenType);
}

export function getUser() {
  const user = localStorage.getItem(AUTH_KEYS.user);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getUserId() {
  return localStorage.getItem(AUTH_KEYS.userId);
}

export function getEmployeeId() {
  return localStorage.getItem(AUTH_KEYS.employeeId);
}

export function getRoleId() {
  return localStorage.getItem(AUTH_KEYS.roleId);
}

export function getRoleCode() {
  return localStorage.getItem(AUTH_KEYS.roleCode);
}

export function getRoleName() {
  return localStorage.getItem(AUTH_KEYS.roleName);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export function clearAuthData() {
  Object.values(AUTH_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}