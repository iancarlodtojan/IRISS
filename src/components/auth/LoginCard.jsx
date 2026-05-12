import UserAvatarIcon from "./UserAvatarIcon";

export default function LoginCard() {
  return (
    <div className="absolute left-[60%] top-[55px] z-20 w-[400px] h-[550px] bg-[#3994a5] rounded-[8px] shadow-md px-[30px] py-[20px]">
      
      <h2 className="text-white text-[35px] font-extrabold text-center leading-none mb-4">
        LOG IN
      </h2>

      <div className="flex justify-center mb-8">
        <UserAvatarIcon />
      </div>

      <form>
        <label className="block text-white text-[18px] mb-0.5">
          Username
        </label>

        <input
          type="text"
          placeholder="Enter Username..."
          className="w-full h-[46px] rounded-[9px] px-3 text-[18px] italic text-gray-700 placeholder:text-gray-400 bg-white outline-none focus:ring-4 focus:ring-[#9ed5d9]"
        />

        <label className="block text-white text-[18px] mt-3 mb-0.5">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter Password..."
          className="w-full h-[46px] rounded-[9px] px-3 text-[18px] italic text-gray-700 placeholder:text-gray-400 bg-white outline-none focus:ring-4 focus:ring-[#9ed5d9]"
        />

        <div className="text-right mt-1">
          <button
            type="button"
            className="text-white text-[16px] font-bold hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full h-[45px] mt-8 rounded-[8px] bg-[#9ed5d9] text-white text-[24px] font-extrabold shadow-sm hover:bg-[#8bcbd0] active:scale-[0.98] transition"
        >
          LOG IN
        </button>
      </form>
    </div>
  );
}