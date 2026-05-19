import { useEffect, useState } from "react";

import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { adminLinks } from "../../constants/sidebarLinks";
import { supabase } from "../../lib/supabaseClient";
import { UserRound } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, full_name, username, email, role, status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (!ignore) setUsers(data || []);
    }

    loadUsers();

    const channel = supabase
      .channel("admin-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        loadUsers
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppLayout links={adminLinks}>
      <h1 className="mb-7 text-4xl font-black">USERS</h1>

      <div className="rounded-3xl bg-white p-8 shadow-md">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black">System Users</h2>
            <p className="text-sm text-gray-500">Registered system accounts</p>
          </div>

          <span className="rounded-full bg-[#3693a8]/10 px-5 py-2 text-sm font-bold text-[#3693a8]">
            {users.length} users
          </span>
        </div>

        {users.length === 0 ? (
          <div className="flex py-20 items-center justify-center text-gray-400">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="rounded-2xl border border-gray-200 bg-[#f8f8f8] p-5 shadow-sm"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3693a8]/10">
                      <UserRound className="h-6 w-6 text-[#3693a8]" />
                    </div>

                    <div>
                      <h3 className="font-black">{user.full_name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                      user.status === "active" ? "bg-[#4AAA5A]" : "bg-[#cf7f88]"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Email
                    </p>
                    <p className="truncate text-gray-700">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Role
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-4 py-1 text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-[#cf4f74]/10 text-[#cf4f74]"
                          : user.role === "logistics"
                          ? "bg-[#F78D41]/10 text-[#F78D41]"
                          : "bg-[#3693a8]/10 text-[#3693a8]"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}