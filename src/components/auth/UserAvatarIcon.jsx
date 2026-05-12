import userAvatar from "../../assets/images/icon.png";

export default function UserAvatarIcon() {
  return (
    <img
      src={userAvatar}
      alt="User Avatar"
      className="h-[55px] w-[55px] object-contain"
    />
  );
}