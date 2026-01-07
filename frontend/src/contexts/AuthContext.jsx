import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import httpStatus from "http-status";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      const response = await client.post("/register", {
        name,
        username,
        password,
      });

      if (response.status === httpStatus.CREATED) {
        setUserData(response.data.user); // optional
        return response.data.message;
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (username, password)=>{
    try {
        let request = await client.post("/login", {
            username: username,
            password: password,
        })
        if(request.status === httpStatus.OK){
            localStorage.setItem("token", request.data.token);
            router("/home")
        }
    } catch (error) {
        throw error;
    }
  }

  const getHistoryOfUser = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token")
        }
      });
      return request.data
    } catch
      (err) {
      throw err;
    }
  }

   const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode
      });
      return request
    } catch (e) {
      throw e;
    }
    }

  const value = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    addToUserHistory,
    getHistoryOfUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
