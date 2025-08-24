"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserListPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) {
            setError("Giriş yapmalısınız.");
            return;
        }
        fetch("http://localhost:3001/api/auth/users", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(async (res) => {
                if (!res.ok) {
                    if (res.status === 403) setError("Yetkiniz yok (admin olmalısınız)");
                    else setError("Kullanıcılar alınamadı");
                    return;
                }
                const data = await res.json();
                setUsers(data);
            })
            .catch(() => setError("Kullanıcılar alınamadı"));
    }, []);

    if (error) return <div className="max-w-md mx-auto mt-10 text-red-600">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Kullanıcı Listesi</h2>
            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">E-posta</th>
                        <th className="p-2 border">Ad</th>
                        <th className="p-2 border">Rol</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td className="p-2 border">{u.id}</td>
                            <td className="p-2 border">{u.email}</td>
                            <td className="p-2 border">{u.name}</td>
                            <td className="p-2 border">{u.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
