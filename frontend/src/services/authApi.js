import { request } from "./api";

export const authApi = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  registro: (nombre, email, password) =>
    request("/auth/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, email, password }),
    }),
};
