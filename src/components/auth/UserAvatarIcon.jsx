import userAvatar from "../../assets/images/account_icon.png";

export default function UserAvatarIcon({ className = "" }) {
  return (
    <img
      src={userAvatar}
      alt="User Avatar"
      className={`object-contain ${className}`}
    />
  );
}