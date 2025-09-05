// import { getSession as getServerSession } from "@/modules/Auth/lib";
import axios, { CreateAxiosDefaults } from "axios";

const BACKEND_URL =
  process.env["NEXT_PUBLIC_BACKEND_APP_URL"] || "http://localhost:8000";

const apiRequest = () => {
  const defaultOptions: CreateAxiosDefaults = {
    timeout: 4000,
    baseURL: `${BACKEND_URL}/api/`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const instance = axios.create(defaultOptions);

  return instance;
};

export default apiRequest();
