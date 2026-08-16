import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'pro_users.json');

interface ProUser {
  email: string;
  expiresAt: number; // Timestamp
  activatedAt: string;
}

function getProUsers(): ProUser[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}

function saveProUsers(users: ProUser[]) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  } catch (e) {}
}

export async function POST(req: Request) {
  try {
    const { action, email, days = 30, pin } = await req.json();

    if (pin && pin !== '9988') {
      return NextResponse.json({ error: 'PIN Salah!' }, { status: 403 });
    }

    let proUsers = getProUsers();
    const now = Date.now();

    // 1. Aktivasi dengan durasi hari (Default: 30 hari)
    if (action === 'activate_email' && email) {
      const cleanEmail = email.trim().toLowerCase();
      const expiresAt = now + days * 24 * 60 * 60 * 1000;

      proUsers = proUsers.filter(u => u.email !== cleanEmail);
      proUsers.push({
        email: cleanEmail,
        expiresAt,
        activatedAt: new Date().toLocaleDateString('id-ID'),
      });

      saveProUsers(proUsers);
      return NextResponse.json({ success: true, proUsers });
    }

    // 2. Cabut manual
    if (action === 'deactivate_email' && email) {
      const cleanEmail = email.trim().toLowerCase();
      proUsers = proUsers.filter(u => u.email !== cleanEmail);
      saveProUsers(proUsers);
      return NextResponse.json({ success: true, proUsers });
    }

    // 3. Cek apakah masih aktif (Otomatis Expire jika waktu lewat)
    if (action === 'check_status' && email) {
      const cleanEmail = email.trim().toLowerCase();
      const user = proUsers.find(u => u.email === cleanEmail);

      if (user) {
        if (now < user.expiresAt) {
          const daysLeft = Math.ceil((user.expiresAt - now) / (1000 * 60 * 60 * 24));
          return NextResponse.json({ isPro: true, daysLeft, expiresAt: user.expiresAt });
        } else {
          // Sudah kadaluarsa -> otomatis hapus dari database
          proUsers = proUsers.filter(u => u.email !== cleanEmail);
          saveProUsers(proUsers);
          return NextResponse.json({ isPro: false, expired: true });
        }
      }
      return NextResponse.json({ isPro: false });
    }

    // 4. Ambil semua data member untuk Admin
    if (action === 'get_all') {
      // Bersihkan yang sudah kadaluarsa dulu
      const validUsers = proUsers.filter(u => u.expiresAt > now);
      if (validUsers.length !== proUsers.length) {
        saveProUsers(validUsers);
      }
      return NextResponse.json({ proUsers: validUsers });
    }

    return NextResponse.json({ proUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
