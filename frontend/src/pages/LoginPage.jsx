import React, { useState } from "react";
import axios from "axios";
import { apiClient, API_BASE_URL, BACKEND_BASE_URL } from "../api/apiClient";
import AppLoader from "../components/common/AppLoader.jsx";
import BrandLogo from "../components/common/BrandLogo.jsx";
import "./login.css";

const AUTH_HEADER_STORAGE_KEY = "sum_auth_header";

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const authHeader = "Basic " + btoa(email + ":" + password);

        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: authHeader },
        });

        axios.defaults.headers.common["Authorization"] = authHeader;
        apiClient.defaults.headers.common["Authorization"] = authHeader;
        localStorage.setItem(AUTH_HEADER_STORAGE_KEY, authHeader);
        onLogin(response.data);
      } else {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
          name,
          email,
          password,
          pictureUrl,
        });
        setSuccess(String(response.data || "Registration successful. Please sign in."));
        setIsLogin(true);
        setPassword("");
      }
    } catch (err) {
      setError(
        err.response?.data ||
          err.response?.data?.message ||
          (isLogin ? "Invalid credentials" : "Error registering")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className={`loginCard ${isLogin ? "modeSignIn" : "modeSignUp"}`}>
        <BrandLogo className="loginBrand" />

        <div className="loginBadge" aria-hidden="true">
          ⤶
        </div>

        <div
          className={`authSwitch ${isLogin ? "signin" : "signup"}`}
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            type="button"
            className={isLogin ? "authSwitchBtn active" : "authSwitchBtn"}
            onClick={() => {
              setIsLogin(true);
              setError("");
              setSuccess("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={!isLogin ? "authSwitchBtn active" : "authSwitchBtn"}
            onClick={() => {
              setIsLogin(false);
              setError("");
              setSuccess("");
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 className="loginTitle">{isLogin ? "Sign in with email" : "Create your account"}</h2>
        <p className="loginSubtitle">
          {isLogin
            ? "Welcome back to Campus Velora."
            : "Join Campus Velora with your details."}
        </p>

        {error && <div className="loginError">{String(error)}</div>}
        {success && <div className="loginSuccess">{String(success)}</div>}

        <form onSubmit={handleSubmit} className="loginForm">
          {!isLogin && (
            <>
              <div className="loginField">
                <label htmlFor="signup-name" className="loginLabel">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required={!isLogin}
                />
              </div>

              <div className="loginField">
                <label htmlFor="signup-picture" className="loginLabel">
                  Profile Picture URL (optional)
                </label>
                <input
                  id="signup-picture"
                  type="url"
                  value={pictureUrl}
                  onChange={(e) => setPictureUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          <div className="loginField">
            <label htmlFor="login-email" className="loginLabel">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
            />
          </div>

          <div className="loginField">
            <label htmlFor="login-password" className="loginLabel">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="loginPrimaryBtn">
            {loading ? (
              <AppLoader label="Processing..." variant="button" />
            ) : isLogin ? (
              "Get Started"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {isLogin && (
          <>
            <div className="loginDivider">
              <span>or sign in with</span>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = `${BACKEND_BASE_URL}/oauth2/authorization/google`;
              }}
              className="loginGoogleBtn"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
              />
              <span>Continue with Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
