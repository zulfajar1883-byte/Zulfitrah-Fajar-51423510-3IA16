import { useState, useMemo, useEffect } from "react";

const API_URL = "http://localhost/tiket_padel/api";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [ticketTypes, setTicketTypes] = useState([]);
  const [bookings, setBookings] = useState([]);

  // ================== AUTH ==================

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.message || "Username atau password salah.");
        return;
      }

      setCurrentUser(data.user); // {id, username, name, role}
      setLoginError("");
    } catch (err) {
      console.error(err);
      setLoginError("Gagal terhubung ke server backend.");
    }
  };

  // ================== DAFTAR AKUN ==================
  const handleRegister = async ({ username, password, name }) => {
    try {
      const res = await fetch(`${API_URL}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.message || "Gagal mendaftar.");
        return;
      }

      setAuthMode("login");
      setLoginError("Pendaftaran berhasil, silakan login.");
    } catch (err) {
      console.error(err);
      setLoginError("Gagal terhubung ke server backend.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTicketTypes([]);
    setBookings([]);
    setAuthMode("login");
    setLoginError("");
  };

  // ================== LOAD DATA SETELAH LOGIN ==================

  useEffect(() => {
    if (!currentUser) return;

    const loadTickets = async () => {
      try {
        const res = await fetch(`${API_URL}/tickets.php`);
        const data = await res.json();
        setTicketTypes(data);
      } catch (err) {
        console.error("Gagal load tiket:", err);
      }
    };

    const loadBookings = async () => {
      try {
        let url = `${API_URL}/bookings.php`;
        if (currentUser.role === "user") {
          url += `?user_id=${currentUser.id}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("Gagal load bookings:", err);
      }
    };

    loadTickets();
    loadBookings();
  }, [currentUser]);

  // ================== CRUD Ticket Types (ADMIN) ==================

  const createOrUpdateTicketType = async (ticket) => {
    try {
      if (ticket.id) {
        // UPDATE
        await fetch(`${API_URL}/tickets.php?id=${ticket.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ticket.name,
            price: ticket.price,
          }),
        });
      } else {
        // INSERT
        await fetch(`${API_URL}/tickets.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ticket.name,
            price: ticket.price,
          }),
        });
      }

      // reload dari backend supaya sinkron dengan DB
      const res = await fetch(`${API_URL}/tickets.php`);
      const data = await res.json();
      setTicketTypes(data);
    } catch (err) {
      console.error("Gagal simpan tiket:", err);
    }
  };

  const deleteTicketType = async (id) => {
    try {
      await fetch(`${API_URL}/tickets.php?id=${id}`, {
        method: "DELETE",
      });

      const res = await fetch(`${API_URL}/tickets.php`);
      const data = await res.json();
      setTicketTypes(data);
    } catch (err) {
      console.error("Gagal hapus tiket:", err);
    }
  };

  // ================== ADMIN: KONFIRMASI / HAPUS BOOKING ==================

  const confirmPayment = async (bookingId) => {
    try {
      await fetch(`${API_URL}/bookings.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: "Lunas",
        }),
      });

      const res = await fetch(`${API_URL}/bookings.php`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Gagal konfirmasi pembayaran:", err);
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      await fetch(`${API_URL}/bookings.php?id=${bookingId}`, {
        method: "DELETE",
      });

      const res = await fetch(`${API_URL}/bookings.php`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Gagal hapus booking:", err);
    }
  };

  // ================== USER: BUAT BOOKING & BAYAR ==================

  const createBooking = async (bookingInput) => {
    if (!currentUser) return;

    try {
      await fetch(`${API_URL}/bookings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          ticket_type_id: bookingInput.ticketTypeId,
          date: bookingInput.date,
          time: bookingInput.time,
          players: bookingInput.players,
          payment_method: bookingInput.paymentMethod,
        }),
      });

      // reload booking user
      const res = await fetch(
        `${API_URL}/bookings.php?user_id=${currentUser.id}`
      );
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Gagal buat booking:", err);
    }
  };

  const payBooking = async (bookingId) => {
    if (!currentUser) return;

    try {
      await fetch(`${API_URL}/bookings.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: "Menunggu Konfirmasi",
        }),
      });

      const res = await fetch(
        `${API_URL}/bookings.php?user_id=${currentUser.id}`
      );
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Gagal update status bayar:", err);
    }
  };

  // ================== RENDER LOGIN / REGISTER ==================

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Sewa Lapangan Padel
          </h1>
          <p className="text-sm text-slate-300 mb-6 text-center">
            {authMode === "login" ? "" : "Daftar akun baru"}
          </p>

          {authMode === "login" ? (
            <>
              <LoginForm onLogin={handleLogin} error={loginError} />
              <p className="mt-4 text-xs text-slate-400 text-center">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setLoginError("");
                  }}
                  className="text-emerald-400 hover:underline"
                >
                  Daftar sekarang
                </button>
              </p>
            </>
          ) : (
            <>
              <RegisterForm onRegister={handleRegister} error={loginError} />
              <p className="mt-4 text-xs text-slate-400 text-center">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setLoginError("");
                  }}
                  className="text-emerald-400 hover:underline"
                >
                  Kembali ke login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ================== RENDER DASHBOARD ==================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-black">
              P
            </div>
            <div>
              <h1 className="font-semibold">Padel Ticketing System</h1>
              <p className="text-xs text-slate-400">
                Dashboard {currentUser.role === "admin" ? "Admin" : "User"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              {/* tampilkan username, bukan name */}
              <p className="font-medium">{currentUser.username}</p>
              <p className="text-slate-400 capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-700 hover:border-red-400 hover:text-red-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentUser.role === "admin" ? (
          <AdminDashboard
            ticketTypes={ticketTypes}
            bookings={bookings}
            onSaveTicketType={createOrUpdateTicketType}
            onDeleteTicketType={deleteTicketType}
            onConfirmPayment={confirmPayment}
            onDeleteBooking={deleteBooking}
          />
        ) : (
          <UserDashboard
            ticketTypes={ticketTypes}
            bookings={bookings} // sudah difilter di backend pakai user_id
            onCreateBooking={createBooking}
            onPayBooking={payBooking}
          />
        )}
      </main>
    </div>
  );
}

// ================== LOGIN COMPONENT ==================

function LoginForm({ onLogin, error }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(form.username.trim(), form.password.trim());
  };

  // cek apakah pesan ini pesan sukses
  const isSuccess = error === "Pendaftaran berhasil, silakan login.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className={
            "text-sm px-3 py-2 rounded-lg border " +
            (isSuccess
              ? "text-emerald-300 bg-emerald-900/20 border-emerald-600"
              : "text-red-400 bg-red-900/20 border-red-700")
          }
        >
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label
          htmlFor="username"
          className="text-sm font-medium text-slate-200"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Masukkan username"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-200"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Masukkan password"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25"
      >
        Login
      </button>
    </form>
  );
}

// ================== REGISTER COMPONENT ==================

function RegisterForm({ onRegister, error }) {
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setLocalError("Username dan password wajib diisi.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setLocalError("Konfirmasi password tidak sama.");
      return;
    }

    setLocalError("");
    onRegister({
      username: form.username.trim(),
      password: form.password.trim(),
      name: form.name.trim(),
    });
  };

  const combinedError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {combinedError && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-700 px-3 py-2 rounded-lg">
          {combinedError}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="reg-username"
          className="text-sm font-medium text-slate-200"
        >
          Username
        </label>
        <input
          id="reg-username"
          name="username"
          value={form.username}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Masukkan username"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="reg-name"
          className="text-sm font-medium text-slate-200"
        >
          Nama lengkap
        </label>
        <input
          id="reg-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Masukkan Nama Lengkap"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="reg-password"
          className="text-sm font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="minimal 3 karakter"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="reg-confirm-password"
          className="text-sm font-medium text-slate-200"
        >
          Konfirmasi Password
        </label>
        <input
          id="reg-confirm-password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="ulangi password"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25"
      >
        Daftar
      </button>
    </form>
  );
}

// ================== ADMIN DASHBOARD ==================

function AdminDashboard({
  ticketTypes,
  bookings,
  onSaveTicketType,
  onDeleteTicketType,
  onConfirmPayment,
  onDeleteBooking,
}) {
  const [editingTicket, setEditingTicket] = useState(null);

  const stats = useMemo(() => {
    const totalTransaksi = bookings.length;
    const totalLunas = bookings.filter((b) => b.status === "Lunas").length;
    const totalPendapatan = bookings
      .filter((b) => b.status === "Lunas")
      .reduce((sum, b) => sum + b.total, 0);

    return {
      totalTransaksi,
      totalLunas,
      totalPendapatan,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Transaksi"
          value={stats.totalTransaksi}
          subtitle="Semua status"
        />
        <StatCard
          label="Transaksi Lunas"
          value={stats.totalLunas}
          subtitle="Sudah dibayar"
        />
        <StatCard
          label="Total Pendapatan"
          value={"Rp " + stats.totalPendapatan.toLocaleString("id-ID")}
          subtitle="Hanya yang lunas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KELOLA TIKET */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Kelola Jenis Tiket</h2>
              {editingTicket && (
                <button
                  onClick={() => setEditingTicket(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  + Tiket baru
                </button>
              )}
            </div>
            <TicketForm
              key={editingTicket ? editingTicket.id : "new-ticket"}
              initial={editingTicket}
              onSave={(t) => {
                onSaveTicketType(t);
                setEditingTicket(null);
              }}
            />
            <TicketTypeList
              ticketTypes={ticketTypes}
              onEdit={setEditingTicket}
              onDelete={onDeleteTicketType}
            />
          </div>
        </div>

        {/* TABEL TRANSAKSI */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <h2 className="font-semibold text-sm mb-3">
              Semua Transaksi Tiket
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="py-2 px-2 text-left">User</th>
                    <th className="py-2 px-2 text-left">Tiket</th>
                    <th className="py-2 px-2 text-left">Tanggal</th>
                    <th className="py-2 px-2 text-left">Jam</th>
                    <th className="py-2 px-2 text-left">Pemain</th>
                    <th className="py-2 px-2 text-left">Metode</th>
                    <th className="py-2 px-2 text-left">Total</th>
                    <th className="py-2 px-2 text-left">Status</th>
                    <th className="py-2 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="py-6 text-center text-slate-400"
                      >
                        Belum ada transaksi.
                      </td>
                    </tr>
                  )}
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-800/80 hover:bg-slate-900/40"
                    >
                      <td className="py-2 px-2">{b.username}</td>
                      <td className="py-2 px-2">{b.ticketName}</td>
                      <td className="py-2 px-2">{b.date}</td>
                      <td className="py-2 px-2">{b.time}</td>
                      <td className="py-2 px-2">{b.players}</td>
                      <td className="py-2 px-2">{b.paymentMethod}</td>
                      <td className="py-2 px-2">
                        Rp {b.total.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-2 px-2 text-right space-x-2">
                        {b.status === "Menunggu Konfirmasi" && (
                          <button
                            onClick={() => onConfirmPayment(b.id)}
                            className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/90 text-slate-900 font-semibold hover:bg-emerald-400"
                          >
                            Konfirmasi
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Yakin mau menghapus transaksi ini?"
                              )
                            ) {
                              onDeleteBooking(b.id);
                            }
                          }}
                          className="text-[11px] px-2 py-1 rounded-full bg-red-500/80 text-slate-50 hover:bg-red-400"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              *Status &quot;Menunggu Konfirmasi&quot; artinya user sudah
              melakukan pembayaran dan menunggu verifikasi admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== USER DASHBOARD ==================

function UserDashboard({
  ticketTypes,
  bookings,
  onCreateBooking,
  onPayBooking,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM PEMESANAN */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <h2 className="font-semibold text-sm mb-3">Pesan Tiket Padel</h2>
            <BookingForm
              ticketTypes={ticketTypes}
              onCreateBooking={onCreateBooking}
            />
          </div>
        </div>

        {/* RIWAYAT TRANSAKSI */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <h2 className="font-semibold text-sm mb-3">
              Riwayat Transaksi Saya
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="py-2 px-2 text-left">Tiket</th>
                    <th className="py-2 px-2 text-left">Tanggal</th>
                    <th className="py-2 px-2 text-left">Jam</th>
                    <th className="py-2 px-2 text-left">Pemain</th>
                    <th className="py-2 px-2 text-left">Metode</th>
                    <th className="py-2 px-2 text-left">Total</th>
                    <th className="py-2 px-2 text-left">Status</th>
                    <th className="py-2 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-6 text-center text-slate-400"
                      >
                        Belum ada transaksi. Yuk pesan tiket dulu!
                      </td>
                    </tr>
                  )}
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-800/80 hover:bg-slate-900/40"
                    >
                      <td className="py-2 px-2">{b.ticketName}</td>
                      <td className="py-2 px-2">{b.date}</td>
                      <td className="py-2 px-2">{b.time}</td>
                      <td className="py-2 px-2">{b.players}</td>
                      <td className="py-2 px-2">{b.paymentMethod}</td>
                      <td className="py-2 px-2">
                        Rp {b.total.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-2 px-2 text-right">
                        {b.status === "Belum Bayar" && (
                          <button
                            onClick={() => onPayBooking(b.id)}
                            className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/90 text-slate-900 font-semibold hover:bg-emerald-400"
                          >
                            Bayar Sekarang
                          </button>
                        )}
                        {b.status !== "Belum Bayar" && (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              *Setelah klik &quot;Bayar Sekarang&quot;, status akan menjadi
              &quot;Menunggu Konfirmasi&quot; sampai diverifikasi admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== SMALL COMPONENTS ==================

function StatCard({ label, value, subtitle }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  let color = "bg-slate-600/60 text-slate-100 border-slate-500/60";

  if (status === "Belum Bayar") {
    color = "bg-amber-500/15 text-amber-300 border-amber-400/40";
  } else if (status === "Menunggu Konfirmasi") {
    color = "bg-sky-500/15 text-sky-300 border-sky-400/40";
  } else if (status === "Lunas") {
    color = "bg-emerald-500/15 text-emerald-300 border-emerald-400/40";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] ${color}`}
    >
      {status}
    </span>
  );
}

// Form jenis tiket (Admin)
function TicketForm({ initial, onSave }) {
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: initial?.id || null,
    name: initial?.name || "",
    price: initial?.price || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "price" ? Number(value) || "" : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      setError("Nama tiket dan harga wajib diisi.");
      return;
    }

    setError("");

    onSave({
      id: form.id,
      name: form.name,
      price: Number(form.price),
    });

    if (!form.id) {
      setForm({ id: null, name: "", price: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-900/40 rounded-xl p-3 mb-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Nama Paket</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Masukkan nama paket"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Harga per Paket (Rp)</label>
        <input
          name="price"
          type="number"
          min="0"
          value={form.price}
          onChange={handleChange}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="150000"
        />
      </div>

      {error && (
        <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-700 px-2 py-1 rounded">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full py-1.5 rounded-lg bg-emerald-500 text-slate-900 font-semibold text-xs hover:bg-emerald-400 transition"
      >
        {form.id ? "Update Tiket" : "Tambah Tiket"}
      </button>
    </form>
  );
}

function TicketTypeList({ ticketTypes, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs text-slate-400 mb-1">Daftar Paket</h3>
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {ticketTypes.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between text-xs bg-slate-900/40 border border-slate-700 rounded-lg px-2.5 py-1.5"
          >
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-[11px] text-slate-400">
                Rp {t.price.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(t)}
                className="px-2 py-0.5 rounded-full border border-slate-600 text-[11px] hover:border-emerald-400 hover:text-emerald-300"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Yakin mau menghapus jenis tiket ini?")) {
                    onDelete(t.id);
                  }
                }}
                className="px-2 py-0.5 rounded-full border border-slate-600 text-[11px] hover:border-red-400 hover:text-red-300"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {ticketTypes.length === 0 && (
          <p className="text-[11px] text-slate-400">Belum ada jenis tiket.</p>
        )}
      </div>
    </div>
  );
}

// Form booking (User)
function BookingForm({ ticketTypes, onCreateBooking }) {
  const [form, setForm] = useState({
    ticketTypeId: ticketTypes[0]?.id || "",
    date: "",
    time: "",
    players: 2,
    paymentMethod: "QRIS",
  });
  const [error, setError] = useState("");

  // update default ticket ketika data tiket sudah masuk dari backend
  useEffect(() => {
    if (!form.ticketTypeId && ticketTypes[0]?.id) {
      setForm((f) => ({ ...f, ticketTypeId: ticketTypes[0].id }));
    }
  }, [ticketTypes, form.ticketTypeId]);

  const selectedTicket = ticketTypes.find(
    (t) => Number(t.id) === Number(form.ticketTypeId)
  );

  const price = selectedTicket ? Number(selectedTicket.price) : 0;
  const totalEstimate = price * (Number(form.players) || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === "players"
          ? Number(value) || 1
          : name === "ticketTypeId"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.ticketTypeId || !form.date || !form.time) {
      setError("Jenis tiket, tanggal, dan jam wajib diisi.");
      return;
    }

    setError("");
    onCreateBooking(form);
    setForm((f) => ({ ...f, date: "", time: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs">
      <div className="space-y-1">
        <label className="text-slate-300">Jenis Tiket</label>
        <select
          name="ticketTypeId"
          value={form.ticketTypeId}
          onChange={handleChange}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          {ticketTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - Rp {t.price.toLocaleString("id-ID")}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-slate-300">Tanggal Main</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-300">Jam</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-slate-300">Jumlah Pemain</label>
          <input
            type="number"
            min="1"
            max="8"
            name="players"
            value={form.players}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-300">Metode Pembayaran</label>
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option>QRIS</option>
            <option>Transfer Bank</option>
            <option>Cash</option>
          </select>
        </div>
      </div>

      <div className="mt-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
        <p className="text-[11px] text-slate-300">Estimasi Total:</p>
        <p className="font-semibold mt-1">
          Rp {totalEstimate.toLocaleString("id-ID")}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          *Total bisa berubah jika ada promo atau biaya tambahan.
        </p>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-700 px-2 py-1 rounded">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
      >
        Pesan Tiket
      </button>
    </form>
  );
}

export default App;
