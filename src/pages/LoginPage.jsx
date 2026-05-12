import LoginCard from "../components/auth/LoginCard";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-[#eaf8fa] overflow-hidden">
      
      {/* Background Circles */}
      <div className="absolute -left-[350px] top-[65px] w-[1199px] h-[1188px] rounded-full bg-[#cf4a73]" />
      
      <div className="absolute -left-[60px] top-[190px] w-[800px] h-[800px] rounded-full bg-[#cc7d88]" />

      {/* Left Branding */}
      <div className="absolute left-[58px] top-[370px] z-10">
        <h1 className="text-[86px] leading-none font-black text-black tracking-tight mb-6">
          IRISS
        </h1>

        <p className="text-[30px] font-semibold text-black leading-[1.35]">
          Improved
          <br />
          Repository and
          <br />
          Inventory Sales System
        </p>
      </div>

      {/* Login Card */}
      <LoginCard />
    </div>
  );
}