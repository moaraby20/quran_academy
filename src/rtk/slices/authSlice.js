import { createSlice } from "@reduxjs/toolkit";
const getSavedAuth = () => {
  try {
    const savedToken = localStorage.getItem("academy_token") || localStorage.getItem("token");
    const savedUserStr = localStorage.getItem("academy_user") || localStorage.getItem("user");
    if (savedToken && savedUserStr) {
      const parsedUser = JSON.parse(savedUserStr);
      return { user: parsedUser, token: savedToken };
    }
  } catch (e) {
    console.error("Failed to parse saved auth state:", e);
  }
  return { user: null, token: null };
};
const initialAuth = getSavedAuth();
const initialState = {
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: !!initialAuth.token && !!initialAuth.user,
  role: initialAuth.user?.role || null
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.role = user.role;
      try {
        localStorage.setItem("academy_token", token);
        localStorage.setItem("academy_user", JSON.stringify(user));
        localStorage.setItem("user_role", user.role);
        if (user.role === "admin") {
          localStorage.setItem("admin_token", token);
        } else if (user.role === "moderator") {
          localStorage.setItem("mod_token", token);
        } else {
          localStorage.setItem("teacher_token", token);
        }
      } catch (e) {
        console.error("Failed to persist auth:", e);
      }
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          localStorage.setItem("academy_user", JSON.stringify(state.user));
        } catch (e) {
          console.error("Failed to update local user:", e);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      try {
        localStorage.removeItem("academy_token");
        localStorage.removeItem("academy_user");
        localStorage.removeItem("user_role");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("mod_token");
        localStorage.removeItem("teacher_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {
        console.error("Failed to clear localStorage on logout:", e);
      }
    }
  }
});
const { setCredentials, updateUserProfile, logout } = authSlice.actions;
var stdin_default = authSlice.reducer;
export {
  authSlice,
  stdin_default as default,
  logout,
  setCredentials,
  updateUserProfile
};
