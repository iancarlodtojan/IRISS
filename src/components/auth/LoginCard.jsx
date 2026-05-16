import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import UserAvatarIcon from "./UserAvatarIcon";

export default function LoginCard() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setErrorMessage("Please enter username and password");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("email, role, status")
        .eq("username", trimmedUsername)
        .single();

      if (profileError || !profile) {
        throw new Error("Invalid username or password");
      }

      if (profile.status !== "active") {
        throw new Error("Account is inactive");
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (loginError) {
        throw new Error("Invalid username or password");
      }

      localStorage.setItem("userRole", profile.role);

      if (profile.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (profile.role === "cashier") {
        navigate("/cashier/dashboard", { replace: true });
      } else if (profile.role === "logistics") {
        navigate("/logistics/dashboard", { replace: true });
      } else {
        throw new Error("Invalid role");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute left-[60%] top-[55px] z-20 w-[400px] h-[550px] bg-[#3994a5] rounded-[8px] shadow-md px-[30px] py-[20px]">
      <h2 className="text-white text-[35px] font-extrabold text-center leading-none mb-4">
        LOG IN
      </h2>

      <div className="flex justify-center mb-8">
        <UserAvatarIcon className="h-[40px] w-[40px]" />
      </div>

      <form onSubmit={handleLogin}>
        <label className="block text-white text-[18px] mb-0.5">
          Username
        </label>

        <input
          type="text"
          placeholder="Enter Username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full h-[46px] rounded-[9px] px-3 text-[18px] italic text-gray-700 placeholder:text-gray-400 bg-white outline-none focus:ring-4 focus:ring-[#9ed5d9]"
        />

        <label className="block text-white text-[18px] mt-3 mb-0.5">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter Password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full h-[46px] rounded-[9px] px-3 text-[18px] italic text-gray-700 placeholder:text-gray-400 bg-white outline-none focus:ring-4 focus:ring-[#9ed5d9]"
        />

        {errorMessage && (
          <p className="text-red-200 text-sm mt-4 text-center font-semibold">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[45px] mt-8 rounded-[8px] bg-[#9ed5d9] text-white text-[24px] font-extrabold shadow-sm hover:bg-[#8bcbd0] active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? "LOGGING IN..." : "LOG IN"}
        </button>
      </form>
    </div>
  );
}